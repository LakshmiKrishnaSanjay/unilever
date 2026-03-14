// app/api/users/delete/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. validate caller
    const { data: callerData, error: callerErr } = await supabaseAdmin.auth.getUser(token);
    if (callerErr || !callerData.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 2. only super_admin can delete
    const { data: me, error: meErr } = await supabaseAdmin
      .from("users")
      .select("id, role")
      .eq("auth_id", callerData.user.id)
      .single();

    if (meErr || !me) {
      return NextResponse.json({ error: "Caller profile not found" }, { status: 403 });
    }

    if (me.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // optional: prevent deleting self
    const { data: targetUser, error: targetErr } = await supabaseAdmin
      .from("users")
      .select("id, auth_id, name")
      .eq("id", userId)
      .single();

    if (targetErr || !targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    if (targetUser.auth_id === callerData.user.id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    // 3. delete from auth.users first
    if (targetUser.auth_id) {
      const { error: authDeleteErr } = await supabaseAdmin.auth.admin.deleteUser(
        targetUser.auth_id
      );

      if (authDeleteErr) {
        return NextResponse.json(
          { error: authDeleteErr.message || "Failed to delete auth user" },
          { status: 500 }
        );
      }
    }

    // 4. delete from public.users
    const { error: dbDeleteErr } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", userId);

    if (dbDeleteErr) {
      return NextResponse.json(
        { error: dbDeleteErr.message || "Failed to delete public user" },
        { status: 500 }
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