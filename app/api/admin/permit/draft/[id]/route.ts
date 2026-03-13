import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = _req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Missing auth token" }, { status: 401 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: callerData, error: callerErr } = await supabaseAdmin.auth.getUser(token);
    if (callerErr || !callerData.user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { data: existing, error: exErr } = await supabaseAdmin
      .from("ptws")
      .select("id, status, created_by_auth_id")
      .eq("id", params.id)
      .single();

    if (exErr || !existing) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    if (existing.status !== "DRAFT") return NextResponse.json({ error: "Only DRAFT can be deleted" }, { status: 403 });
    if (existing.created_by_auth_id !== callerData.user.id) {
      return NextResponse.json({ error: "Not allowed (not owner)" }, { status: 403 });
    }

    const { error: delErr } = await supabaseAdmin.from("ptws").delete().eq("id", params.id);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}