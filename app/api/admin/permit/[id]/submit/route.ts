import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

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

    // Validate user
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

    // Get PTW
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

    // Contractor ownership validation
    if (
      !existing.contractor_id ||
      existing.contractor_id !== me.contractor_id
    ) {
      return NextResponse.json(
        { error: "Not allowed for this contractor" },
        { status: 403 }
      );
    }

    // Required fields validation
    const requiredMissing =
      !existing.moc_id ||
      !existing.title ||
      !existing.permit_type ||
      !existing.location ||
      !existing.start_datetime ||
      !existing.end_datetime;

    if (requiredMissing) {
      return NextResponse.json(
        { error: "Missing required fields to submit" },
        { status: 400 }
      );
    }

    // Determine correct next review step
    let nextStatus = "PENDING_SECURITY_REVIEW";

    if (existing.sent_back_to_role === "security") {
      nextStatus = "PENDING_SECURITY_REVIEW";
    }

    if (existing.sent_back_to_role === "facilities") {
      nextStatus = "PENDING_FACILITIES_REVIEW";
    }

    if (existing.sent_back_to_role === "efs") {
      nextStatus = "PENDING_EFS_REVIEW";
    }

    if (existing.sent_back_to_role === "hse") {
      nextStatus = "PENDING_HSE_APPROVAL";
    }

    const nowIso = new Date().toISOString();

    const timeline = Array.isArray(existing.timeline)
      ? existing.timeline
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

    const { data: updated, error: updErr } = await supabaseAdmin
      .from("ptws")
      .update({
        status: nextStatus,
        submission_date: nowIso,
        timeline,
        sent_back_to_role: null,
        sent_back_reason: null,
      })
      .eq("id", id)
      .select("id, status")
      .single();

    if (updErr || !updated) {
      return NextResponse.json(
        { error: updErr?.message || "Submit failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      id: updated.id,
      status: updated.status,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}