import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function normalizeWorkers(worker_list: any[]) {
  if (!Array.isArray(worker_list)) return [];

  return worker_list
    .map((w: any, idx: number) => ({
      name: String(w?.name ?? "").trim(),
      role: String(w?.role ?? "").trim(),
      badge: String(
        w?.badge ?? `W${String(idx + 1).padStart(3, "0")}`
      ).trim(),
      contact: String(w?.contact ?? "").trim(),
      idPassport: String(w?.idPassport ?? "").trim(),
      badge_id: w?.badge_id ?? w?.badgeId ?? null,
      badgeId: w?.badgeId ?? w?.badge_id ?? null,
    }))
    .filter((w: any) => w.name || w.role || w.badge || w.contact || w.idPassport);
}

function validatePTWForSubmit(existing: any) {
  const missing: string[] = [];

  if (!existing.moc_id) missing.push("MOC");
  if (!existing.title) missing.push("Title");
  if (!existing.permit_type) missing.push("Permit Type");
  if (!existing.location) missing.push("Location");
  if (!existing.start_datetime) missing.push("Start Date & Time");
  if (!existing.end_datetime) missing.push("End Date & Time");

  const workers = normalizeWorkers(existing.worker_list);

  if (workers.length === 0) {
    missing.push("Worker List");
  } else {
    const invalidWorker = workers.some(
      (w: any) =>
        !w.name || !w.role || !w.badge || !w.contact || !w.idPassport
    );

    if (invalidWorker) {
      missing.push("Complete Worker Details");
    }

    const badgeSet = new Set(workers.map((w: any) => w.badge));
    if (badgeSet.size !== workers.length) {
      missing.push("Unique Worker Badges");
    }
  }

  return {
    missing,
    workers,
  };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return NextResponse.json(
        { error: "Missing auth token" },
        { status: 401 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: callerData, error: callerErr } =
      await supabaseAdmin.auth.getUser(token);

    if (callerErr || !callerData.user) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const { data: me, error: meErr } = await supabaseAdmin
      .from("users")
      .select("id, auth_id, role, name, contractor_id")
      .eq("auth_id", callerData.user.id)
      .single();

    if (meErr || !me) {
      return NextResponse.json(
        { error: "Caller profile not found" },
        { status: 403 }
      );
    }

    if (me.role !== "contractor_admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { data: existing, error: exErr } = await supabaseAdmin
      .from("ptws")
      .select("*")
      .eq("id", id)
      .single();

    if (exErr || !existing) {
      return NextResponse.json(
        { error: "PTW not found" },
        { status: 404 }
      );
    }

    if (!existing.contractor_id || existing.contractor_id !== me.contractor_id) {
      return NextResponse.json(
        { error: "Not allowed for this contractor" },
        { status: 403 }
      );
    }

    if (existing.status !== "DRAFT" && existing.status !== "SENT_BACK") {
      return NextResponse.json(
        { error: "Only DRAFT or SENT_BACK PTWs can be submitted" },
        { status: 400 }
      );
    }

    const { data: moc, error: mocErr } = await supabaseAdmin
      .from("mocs")
      .select("id, status")
      .eq("id", existing.moc_id)
      .single();

    if (mocErr || !moc) {
      return NextResponse.json(
        { error: "MOC not found" },
        { status: 404 }
      );
    }

    if (moc.status !== "APPROVED") {
      return NextResponse.json(
        { error: "PTW can only be submitted when the MOC is APPROVED" },
        { status: 403 }
      );
    }

    const { missing, workers } = validatePTWForSubmit(existing);

    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: `Missing or invalid required fields: ${missing.join(", ")}`,
        },
        { status: 400 }
      );
    }

    let nextStatus = "PENDING_SECURITY_REVIEW";

    if (existing.sent_back_to_role === "security") {
      nextStatus = "PENDING_SECURITY_REVIEW";
    } else if (existing.sent_back_to_role === "facilities") {
      nextStatus = "PENDING_FACILITIES_REVIEW";
    } else if (existing.sent_back_to_role === "efs") {
      nextStatus = "PENDING_EFS_REVIEW";
    } else if (
      existing.sent_back_to_role === "hse" ||
      existing.sent_back_to_role === "hse_manager"
    ) {
      nextStatus = "PENDING_HSE_APPROVAL";
    }

    const nowIso = new Date().toISOString();

    const timeline = Array.isArray(existing.timeline)
      ? [...existing.timeline]
      : [];

    timeline.push({
      id: `ptl-${Date.now()}`,
      timestamp: nowIso,
      user: me.name || "System",
      role: me.role || "contractor_admin",
      action:
        existing.status === "SENT_BACK"
          ? "Resubmitted PTW"
          : "Submitted PTW",
      status: nextStatus,
    });

    const nextRevision =
      existing.status === "DRAFT"
        ? Math.max(existing.revision_number || 0, 1)
        : (existing.revision_number || 0) + 1;

    const { data: updated, error: updErr } = await supabaseAdmin
      .from("ptws")
      .update({
        status: nextStatus,
        submission_date: nowIso,
        revision_number: nextRevision,
        worker_list: workers,
        timeline,
        sent_back_to_role: null,
        sent_back_reason: null,
        updated_at: nowIso,
      })
      .eq("id", id)
      .select("id, status, revision_number")
      .single();

    if (updErr || !updated) {
      return NextResponse.json(
        { error: updErr?.message || "Submit failed" },
        { status: 400 }
      );
    }

    console.log("SUBMIT API HIT", {
  id,
  existingStatus: existing.status,
  existingRevision: existing.revision_number,
  nextRevision,
});

    return NextResponse.json({
      success: true,
      id: updated.id,
      status: updated.status,
      revision_number: updated.revision_number,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );

    
  }
}