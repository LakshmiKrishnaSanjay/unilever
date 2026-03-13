import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json({ error: "Missing server env keys" }, { status: 500 });
    }

    const supabaseAdmin = createClient(url, serviceKey);

    // ---- AUTH CHECK ----
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
    }

    const { data: callerData, error: callerErr } = await supabaseAdmin.auth.getUser(token);

    if (callerErr || !callerData?.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // ---- ROLE VALIDATION (FIXED) ----
    const { data: me, error: meErr } = await supabaseAdmin
      .from("users")
      .select("id, role, auth_id, email")
      .eq("auth_id", callerData.user.id)
      .maybeSingle();

    if (meErr) {
      return NextResponse.json(
        { error: "Failed to read user profile", details: meErr.message },
        { status: 500 }
      );
    }

    if (!me) {
      return NextResponse.json(
        {
          error: "Forbidden (no matching users row for this auth user)",
          debug: {
            auth_user_id: callerData.user.id,
            auth_email: callerData.user.email,
            hint: "Your public.users.auth_id is probably NULL or not mapped to this auth.users.id",
          },
        },
        { status: 403 }
      );
    }

    const allowedRoles = ["super_admin", "hse_manager", "stakeholder"];

    if (!allowedRoles.includes(me.role)) {
      return NextResponse.json(
        {
          error: "Forbidden (role not allowed)",
          debug: {
            auth_user_id: callerData.user.id,
            auth_email: callerData.user.email,
            db_user_id: me.id,
            db_role: me.role,
          },
        },
        { status: 403 }
      );
    }

    // ---- INSERT MOC ----
    const { data, error } = await supabaseAdmin
      .from("mocs")
      .insert(body)
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}