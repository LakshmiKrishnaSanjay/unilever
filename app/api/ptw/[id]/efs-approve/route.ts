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

    // 1) Get PTW
    const { data: ptw, error } = await supabase
      .from("ptws")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !ptw) {
      return NextResponse.json({ error: "PTW not found" }, { status: 404 });
    }

    // 2) Validate workflow state
    if (ptw.status !== "PENDING_EFS_REVIEW") {
      return NextResponse.json(
        { error: "Invalid workflow state" },
        { status: 400 }
      );
    }

    // 3) Next stage
    const nextStatus = "PENDING_HSE_APPROVAL";

    // 4) Timeline entry
    const timelineEntry = {
      id: `ptl-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "EFS Approved",
      status: nextStatus,
    };

    const updatedTimeline = [...(ptw.timeline || []), timelineEntry];

    // 5) Update DB
    const { error: updateErr } = await supabase
      .from("ptws")
      .update({
        status: nextStatus,
        timeline: updatedTimeline,
      })
      .eq("id", id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      nextStatus,
      message: "EFS Approved",
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}