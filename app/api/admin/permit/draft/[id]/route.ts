import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function DELETE(
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
      .select("id, auth_id, role, contractor_id")
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
      .select("id, status, created_by_auth_id, contractor_id")
      .eq("id", id)
      .single();

    if (exErr || !existing) {
      return NextResponse.json(
        { error: "Draft not found" },
        { status: 404 }
      );
    }

    if (existing.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only DRAFT PTWs can be deleted" },
        { status: 403 }
      );
    }

    if (existing.contractor_id !== me.contractor_id) {
      return NextResponse.json(
        { error: "Not allowed for this contractor" },
        { status: 403 }
      );
    }

    const { error: delErr } = await supabaseAdmin
      .from("ptws")
      .delete()
      .eq("id", id);

    if (delErr) {
      return NextResponse.json(
        { error: delErr.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}