import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      id, // optional: if present -> update existing draft
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

    // For draft save: allow partial save if you want
    // But if your UI always sends these, you can keep strict checks.
    if (!moc_id) return NextResponse.json({ error: "Missing moc_id" }, { status: 400 });

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Missing auth token" }, { status: 401 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1) Validate caller
    const { data: callerData, error: callerErr } = await supabaseAdmin.auth.getUser(token);
    if (callerErr || !callerData.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 2) Load profile
    const { data: me, error: meErr } = await supabaseAdmin
      .from("users")
      .select("id, auth_id, role, name, contractor_id")
      .eq("auth_id", callerData.user.id)
      .single();

    if (meErr || !me) return NextResponse.json({ error: "Caller profile not found" }, { status: 403 });
    if (me.role !== "contractor_admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!me.contractor_id) return NextResponse.json({ error: "User not linked to contractor_id" }, { status: 400 });

    // Optional: If you want drafts only when MOC is APPROVED, keep this.
    // If you want drafting before approval, REMOVE this check.
    const { data: moc, error: mocErr } = await supabaseAdmin
      .from("mocs")
      .select("id, status")
      .eq("id", moc_id)
      .single();

    if (mocErr || !moc) return NextResponse.json({ error: "MOC not found" }, { status: 404 });
    if (moc.status !== "APPROVED") {
      return NextResponse.json({ error: "PTW draft only after MOC is APPROVED" }, { status: 403 });
    }

    const nowIso = new Date().toISOString();

    // common payload
    const payload: any = {
      moc_id,
      title: title ?? null,
      permit_type: permit_type ?? null,
      location: location ?? null,
      start_datetime: start_datetime ?? null,
      end_datetime: end_datetime ?? null,
      requires_facilities_review: !!requires_facilities_review,
      requires_efs_review: !!requires_efs_review,
      requires_stakeholder_closure: !!requires_stakeholder_closure,
      worker_list: worker_list ?? [],
      supporting_permit: supporting_permit ?? null,
      contractor_id: me.contractor_id,
      status: "DRAFT",
    };

    // UPDATE DRAFT
    if (id) {
      // enforce ownership + draft-only edit
      const { data: existing, error: exErr } = await supabaseAdmin
        .from("ptws")
        .select("id, status, created_by_auth_id, timeline")
        .eq("id", id)
        .single();

      if (exErr || !existing) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
      if (existing.status !== "DRAFT") return NextResponse.json({ error: "Only DRAFT can be updated" }, { status: 403 });
      if (existing.created_by_auth_id !== callerData.user.id) {
        return NextResponse.json({ error: "Not allowed (not owner)" }, { status: 403 });
      }

      const timeline = Array.isArray(existing.timeline) ? existing.timeline : [];
      timeline.push({
        id: `ptl-${Date.now()}`,
        timestamp: nowIso,
        user: me.name || "System",
        role: me.role || "contractor_admin",
        action: "Saved Draft",
        status: "DRAFT",
      });

      const { data: updated, error: updErr } = await supabaseAdmin
        .from("ptws")
        .update({ ...payload, timeline })
        .eq("id", id)
        .select("id")
        .single();

      if (updErr || !updated) return NextResponse.json({ error: updErr?.message || "Update failed" }, { status: 400 });
      return NextResponse.json({ success: true, id: updated.id });
    }

    // CREATE DRAFT
    const timelineEntry = {
      id: `ptl-${Date.now()}`,
      timestamp: nowIso,
      user: me.name || "System",
      role: me.role || "contractor_admin",
      action: "Created Draft",
      status: "DRAFT",
    };

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("ptws")
      .insert({
        ...payload,
        revision_number: 1,
        timeline: [timelineEntry],
        created_by_auth_id: callerData.user.id,
      })
      .select("id")
      .single();

    if (insertErr || !inserted) {
      return NextResponse.json({ error: insertErr?.message || "Insert failed" }, { status: 400 });
    }

    return NextResponse.json({ success: true, id: inserted.id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}