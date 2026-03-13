import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      moc_id,
      title,
      permit_type,
      location,
      start_datetime,
      end_datetime,
      requires_facilities_review,
      requires_efs_review,
      worker_list,
      supporting_permit,
    } = body;

    if (!moc_id || !title || !permit_type || !location || !start_datetime || !end_datetime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

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

    // 1. Validate caller
    const { data: callerData, error: callerErr } =
      await supabaseAdmin.auth.getUser(token);

    if (callerErr || !callerData.user) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // 2. Load caller profile
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

    if (!me.contractor_id) {
      return NextResponse.json(
        { error: "Your user is not linked to a contractor_id" },
        { status: 400 }
      );
    }

    // 3. Ensure MOC exists and is approved
    const { data: moc, error: mocErr } = await supabaseAdmin
      .from("mocs")
      .select("id, status")
      .eq("id", moc_id)
      .single();

    if (mocErr || !moc) {
      return NextResponse.json(
        { error: "MOC not found" },
        { status: 404 }
      );
    }

    if (moc.status !== "APPROVED") {
      return NextResponse.json(
        { error: "PTW can only be created after MOC is APPROVED" },
        { status: 403 }
      );
    }

    // 4. Validate worker list
    const cleanedWorkers = Array.isArray(worker_list)
      ? worker_list
          .map((w: any, idx: number) => ({
            name: String(w?.name ?? "").trim(),
            role: String(w?.role ?? "").trim(),
            badge: String(w?.badge ?? `W${String(idx + 1).padStart(3, "0")}`).trim(),
            contact: String(w?.contact ?? "").trim(),
            idPassport: String(w?.idPassport ?? "").trim(),
          }))
          .filter(
            (w: any) =>
              w.name || w.role || w.badge || w.contact || w.idPassport
          )
      : [];

    if (cleanedWorkers.length === 0) {
      return NextResponse.json(
        { error: "At least one worker is required" },
        { status: 400 }
      );
    }

    const hasInvalidWorker = cleanedWorkers.some(
      (w: any) =>
        !w.name || !w.role || !w.badge || !w.contact || !w.idPassport
    );

    if (hasInvalidWorker) {
      return NextResponse.json(
        { error: "Each worker must have name, role, badge, contact, and id/passport" },
        { status: 400 }
      );
    }

    // Optional: prevent duplicate badge codes inside same PTW request
    const badgeSet = new Set(cleanedWorkers.map((w: any) => w.badge));
    if (badgeSet.size !== cleanedWorkers.length) {
      return NextResponse.json(
        { error: "Worker badge values must be unique within the PTW" },
        { status: 400 }
      );
    }

    // 5. Initial PTW status
    const nowIso = new Date().toISOString();
    const nextStatus = "PENDING_SECURITY_REVIEW";

    const timelineEntry = {
      id: `ptl-${Date.now()}`,
      timestamp: nowIso,
      user: me.name || "System",
      role: me.role || "contractor_admin",
      action: "Submitted PTW",
      status: nextStatus,
    };

    // 6. Insert PTW
    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("ptws")
      .insert({
        moc_id,
        title,
        permit_type,
        location,
        start_datetime,
        end_datetime,
        requires_facilities_review: !!requires_facilities_review,
        requires_efs_review: !!requires_efs_review,
        requires_stakeholder_closure: false,
        status: nextStatus,
        revision_number: 1,
        contractor_id: me.contractor_id,
        worker_list: cleanedWorkers,
        supporting_permit: supporting_permit ?? null,
        timeline: [timelineEntry],
        created_by_auth_id: callerData.user.id,
      })
      .select("id")
      .single();

    if (insertErr || !inserted) {
      return NextResponse.json(
        { error: insertErr?.message || "Insert failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      id: inserted.id,
    });
  } catch (err: any) {
    console.error("PTW create route error:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}