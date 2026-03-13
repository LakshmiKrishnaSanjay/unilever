import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {

    const params = await context.params;
    const id = params.id;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1️⃣ Get PTW
    const { data: ptw, error } = await supabase
      .from("ptws")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !ptw) {
      return NextResponse.json(
        { error: "PTW not found" },
        { status: 404 }
      );
    }

    if (ptw.status !== "PENDING_FACILITIES_REVIEW") {
      return NextResponse.json(
        { error: "Invalid workflow state" },
        { status: 400 }
      );
    }

    // 2️⃣ Decide next stage
    let nextStatus = "PENDING_EFS_REVIEW";

    if (!ptw.requires_efs_review) {
      nextStatus = "PENDING_HSE_APPROVAL";
    }

    // 3️⃣ Timeline entry
    const timelineEntry = {
      id: `ptl-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "Facilities Approved",
      status: nextStatus,
    };

    const updatedTimeline = [...(ptw.timeline || []), timelineEntry];

    // 4️⃣ Update DB
    const { error: updateErr } = await supabase
      .from("ptws")
      .update({
        status: nextStatus,
        timeline: updatedTimeline,
      })
      .eq("id", id);

    if (updateErr) {
      return NextResponse.json(
        { error: updateErr.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}