import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, username, role, is_active, password } = body;

    if (!name || !email || !username || !role || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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

    const { data: callerData, error: callerErr } = await supabaseAdmin.auth.getUser(token);

    if (callerErr || !callerData.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

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

    if (role === "super_admin") {
      return NextResponse.json(
        { error: "Creating Super Admin users is not allowed" },
        { status: 403 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const { data: existingEmail } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingEmail) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
    });

    if (createErr || !created.user) {
      return NextResponse.json(
        { error: createErr?.message || "Auth createUser failed" },
        { status: 400 }
      );
    }

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("users")
      .insert({
        auth_id: created.user.id,
        username: String(username).trim(),
        name: String(name).trim(),
        email: normalizedEmail,
        role,
        is_active: typeof is_active === "boolean" ? is_active : true,
      })
      .select("id, auth_id")
      .single();

    if (insertErr) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      return NextResponse.json({ error: insertErr.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      id: inserted.id,
      auth_id: inserted.auth_id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}