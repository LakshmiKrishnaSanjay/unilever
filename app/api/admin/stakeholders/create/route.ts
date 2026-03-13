import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
    }

    const supabaseAdmin = createClient(url, serviceKey);

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: "Missing Authorization Bearer token" }, { status: 401 });
    }

    const { data: callerData, error: callerErr } = await supabaseAdmin.auth.getUser(token);

    if (callerErr || !callerData?.user) {
      return NextResponse.json({ error: "Invalid token or session expired" }, { status: 401 });
    }

    // ✅ Check caller role from public.users
    const { data: me, error: meErr } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("auth_id", callerData.user.id)
      .maybeSingle();

    if (meErr) {
      return NextResponse.json({ error: `Role check failed: ${meErr.message}` }, { status: 500 });
    }

    if (!me) {
      return NextResponse.json(
        { error: "No matching row in public.users for current logged in user (auth_id mismatch)" },
        { status: 403 }
      );
    }

    if (me.role !== "super_admin") {
      return NextResponse.json(
        { error: `Forbidden: your role is ${me.role}, must be super_admin` },
        { status: 403 }
      );
    }

    // ✅ now proceed with creation
    const body = await req.json();
    const { name, department, email, phone, is_active, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields (name/email/password)" }, { status: 400 });
    }

    // Create stakeholder row
    const { data: stakeholderRow, error: stakeErr } = await supabaseAdmin
      .from("stakeholders")
      .insert({
        name,
        department: department || null,
        email,
        phone: phone || null,
        is_active: typeof is_active === "boolean" ? is_active : true,
      })
      .select("id")
      .single();

    if (stakeErr || !stakeholderRow) {
      return NextResponse.json({ error: stakeErr?.message || "Stakeholder insert failed" }, { status: 400 });
    }

    // Create Auth user
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createErr || !created.user) {
      await supabaseAdmin.from("stakeholders").delete().eq("id", stakeholderRow.id);
      return NextResponse.json({ error: createErr?.message || "Auth createUser failed" }, { status: 400 });
    }

    // Insert into public.users with forced stakeholder role
    const { error: userErr } = await supabaseAdmin.from("users").insert({
      auth_id: created.user.id,
      username: email.split("@")[0],
      name,
      email,
      role: "stakeholder",
      is_active: typeof is_active === "boolean" ? is_active : true,
      stakeholder_id: stakeholderRow.id, // if you added it
    });

    if (userErr) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      await supabaseAdmin.from("stakeholders").delete().eq("id", stakeholderRow.id);
      return NextResponse.json({ error: userErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, id: stakeholderRow.id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}