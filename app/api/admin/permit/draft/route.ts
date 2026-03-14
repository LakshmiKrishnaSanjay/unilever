import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      id,
      moc_id,
      title,
      permit_type,
      location,
      start_datetime,
      end_datetime,
      requires_facilities_review,
      requires_efs_review,
      requires_stakeholder_closure,
      worker_list,
      supporting_permit,
    } = body;

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

    // Optional MOC validation only if moc_id exists
    if (moc_id) {
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
          { error: "PTW can only be linked to an APPROVED MOC" },
          { status: 403 }
        );
      }
    }

    // Draft allows partial worker data
    const cleanedWorkers = Array.isArray(worker_list)
      ? worker_list.map((w: any, idx: number) => ({
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
      : [];

    // Optional badge duplicate check if badges are present
    const nonEmptyBadges = cleanedWorkers
      .map((w: any) => w.badge)
      .filter((b: string) => !!b);

    const badgeSet = new Set(nonEmptyBadges);
    if (badgeSet.size !== nonEmptyBadges.length) {
      return NextResponse.json(
        { error: "Worker badge values must be unique within the PTW" },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();

    if (id) {
      // Update existing draft
      const { data: existing, error: existingErr } = await supabaseAdmin
        .from("ptws")
        .select("id, status, contractor_id, timeline")
        .eq("id", id)
        .single();

      if (existingErr || !existing) {
        return NextResponse.json(
          { error: "Draft not found" },
          { status: 404 }
        );
      }

      if (existing.contractor_id !== me.contractor_id) {
        return NextResponse.json(
          { error: "Not allowed for this contractor" },
          { status: 403 }
        );
      }

      if (existing.status !== "DRAFT" && existing.status !== "SENT_BACK") {
        return NextResponse.json(
          { error: "Only DRAFT or SENT_BACK PTWs can be saved as draft" },
          { status: 400 }
        );
      }

      const timeline = Array.isArray(existing.timeline)
        ? [...existing.timeline]
        : [];

      timeline.push({
        id: `ptl-${Date.now()}`,
        timestamp: nowIso,
        user: me.name || "System",
        role: me.role || "contractor_admin",
        action: "Draft Updated",
        status: "DRAFT",
      });

      const { data: updated, error: updateErr } = await supabaseAdmin
        .from("ptws")
        .update({
          moc_id: moc_id ?? null,
          title: title ?? null,
          permit_type: permit_type ?? null,
          location: location ?? null,
          start_datetime: start_datetime ?? null,
          end_datetime: end_datetime ?? null,
          requires_facilities_review: !!requires_facilities_review,
          requires_efs_review: !!requires_efs_review,
          requires_stakeholder_closure: !!requires_stakeholder_closure,
          worker_list: cleanedWorkers,
          supporting_permit: supporting_permit ?? null,
          status: "DRAFT",
          timeline,
          sent_back_to_role: null,
          sent_back_reason: null,
          updated_at: nowIso,
        })
        .eq("id", id)
        .select("id")
        .single();

      if (updateErr || !updated) {
        return NextResponse.json(
          { error: updateErr?.message || "Draft update failed" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        id: updated.id,
      });
    }

    // Create new draft
    const timelineEntry = {
      id: `ptl-${Date.now()}`,
      timestamp: nowIso,
      user: me.name || "System",
      role: me.role || "contractor_admin",
      action: "Draft Created",
      status: "DRAFT",
    };

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("ptws")
      .insert({
        moc_id: moc_id ?? null,
        title: title ?? null,
        permit_type: permit_type ?? null,
        location: location ?? null,
        start_datetime: start_datetime ?? null,
        end_datetime: end_datetime ?? null,
        requires_facilities_review: !!requires_facilities_review,
        requires_efs_review: !!requires_efs_review,
        requires_stakeholder_closure: !!requires_stakeholder_closure,
        status: "DRAFT",
        revision_number: 0,
        contractor_id: me.contractor_id,
        worker_list: cleanedWorkers,
        supporting_permit: supporting_permit ?? null,
        timeline: [timelineEntry],
        created_by_auth_id: callerData.user.id,
        submission_date: null,
        sent_back_to_role: null,
        sent_back_reason: null,
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select("id")
      .single();

    if (insertErr || !inserted) {
      return NextResponse.json(
        { error: insertErr?.message || "Draft insert failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      id: inserted.id,
    });
  } catch (err: any) {
    console.error("PTW draft route error:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}