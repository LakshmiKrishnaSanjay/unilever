import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { companyName, contactName, email, phone, is_active, password } = body;

    if (!companyName || !contactName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (email && !password) {
      return NextResponse.json(
        { error: "Password is required when email is provided" },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL; // ok, but server env is better
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json({ error: "Missing server env keys" }, { status: 500 });
    }

    const supabaseAdmin = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    // ✅ verify caller token
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Missing auth token" }, { status: 401 });

    const { data: callerData, error: callerErr } = await supabaseAdmin.auth.getUser(token);
    if (callerErr || !callerData?.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // ✅ verify super_admin
    const { data: me, error: meErr } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("auth_id", callerData.user.id)
      .maybeSingle();

    if (meErr || !me) {
      return NextResponse.json({ error: "Caller profile not found" }, { status: 403 });
    }

    if (me.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ 1) create contractor record
    const { data: contractorRow, error: contractorErr } = await supabaseAdmin
      .from("contractors")
      .insert({
        companyName,
        contactName,
        email: email || null,
        phone: phone || null,
        is_active: typeof is_active === "boolean" ? is_active : true,
      })
      .select("id")
      .single();

    if (contractorErr || !contractorRow) {
      return NextResponse.json(
        { error: contractorErr?.message || "Failed to create contractor" },
        { status: 400 }
      );
    }

    // ✅ 2) optional: create login user + profile
    if (email) {
      // optional early check (still keep DB unique constraint!)
      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existingUser) {
        await supabaseAdmin.from("contractors").delete().eq("id", contractorRow.id);
        return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
      }

      const { data: created, error: createErr } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

      if (createErr || !created.user) {
        await supabaseAdmin.from("contractors").delete().eq("id", contractorRow.id);
        return NextResponse.json(
          { error: createErr?.message || "Auth createUser failed" },
          { status: 400 }
        );
      }

      const { error: insertUserErr } = await supabaseAdmin.from("users").insert({
        auth_id: created.user.id,
        username: email.split("@")[0],
        name: contactName,
        email,
        role: "contractor_admin",
        is_active: typeof is_active === "boolean" ? is_active : true,
        contractor_id: contractorRow.id, // must exist in schema
      });

      if (insertUserErr) {
        await supabaseAdmin.auth.admin.deleteUser(created.user.id);
        await supabaseAdmin.from("contractors").delete().eq("id", contractorRow.id);
        return NextResponse.json({ error: insertUserErr.message }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true, id: contractorRow.id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}



export async function GET(req: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json({ error: "Missing server env keys" }, { status: 500 });
    }

    const supabaseAdmin = createClient(url, serviceKey);

    // ✅ verify caller is logged in (Bearer token)
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Missing auth token" }, { status: 401 });

    const { data: callerData, error: callerErr } = await supabaseAdmin.auth.getUser(token);
    if (callerErr || !callerData?.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // ✅ fetch stakeholders
    const { data, error } = await supabaseAdmin
      .from("stakeholders")
      .select("*")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}