import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type WorkerChecklistItem = {
  id: string;
  label: string;
  required: boolean;
  checked: boolean;
};

type Worker = {
  name?: string;
  badge?: string;
  badgeId?: string;
  badge_id?: string;
  role?: string;
  entryStatus?: string;
  entryChecklist?: WorkerChecklistItem[];
  checkedInAt?: string;
  [key: string]: any;
};

function buildDefaultChecklist(): WorkerChecklistItem[] {
  return [
    {
      id: "ptw-area",
      label: "Valid PTW & correct area",
      required: true,
      checked: false,
    },
    {
      id: "ppe",
      label: "PPE checked",
      required: true,
      checked: false,
    },
    {
      id: "tools",
      label: "Tools/Equipment checked",
      required: true,
      checked: false,
    },
    {
      id: "induction",
      label: "Site induction confirmed",
      required: true,
      checked: false,
    },
    {
      id: "briefing",
      label: "Emergency briefing confirmed",
      required: true,
      checked: false,
    },
  ];
}

function generateBadgeId(ptwId: string, index: number) {
  const normalizedPtwId = String(ptwId).replace(/-/g, "");
  return `UNI-BDG-${normalizedPtwId}-${String(index + 1).padStart(2, "0")}`;
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const ptwId = params.id;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1) Fetch PTW
    const { data: ptw, error: ptwError } = await supabase
      .from("ptws")
      .select("*")
      .eq("id", ptwId)
      .single();

    if (ptwError || !ptw) {
      return NextResponse.json(
        { success: false, error: "PTW not found" },
        { status: 404 }
      );
    }

    // 2) Validate workflow state
    if (ptw.status !== "PENDING_HSE_APPROVAL") {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid workflow state. Current status is ${ptw.status}`,
        },
        { status: 400 }
      );
    }

    // 3) Fetch contractor company name
    let contractorCompany = "Contractor";

    if (ptw.contractor_id) {
      const { data: contractor } = await supabase
        .from("contractors")
        .select("companyName")
        .eq("id", ptw.contractor_id)
        .maybeSingle();

      if (contractor?.companyName) {
        contractorCompany = contractor.companyName;
      }
    }

    // 4) Prepare worker list with badge IDs + checklist
    const rawWorkers: Worker[] = Array.isArray(ptw.worker_list) ? ptw.worker_list : [];

    if (rawWorkers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "PTW has no workers. Cannot move to READY_FOR_ENTRY.",
        },
        { status: 400 }
      );
    }

    const updatedWorkerList: Worker[] = rawWorkers.map((worker, index) => {
      const badgeId =
        worker.badge_id ||
        worker.badgeId ||
        generateBadgeId(ptw.id, index);

      return {
        ...worker,
        badge_id: badgeId,
        badgeId: badgeId,
        entryStatus: worker.entryStatus || "PENDING",
        entryChecklist:
          Array.isArray(worker.entryChecklist) && worker.entryChecklist.length > 0
            ? worker.entryChecklist
            : buildDefaultChecklist(),
      };
    });

    // 5) Prepare timeline
    const finalStatus = "READY_FOR_ENTRY";

    const timelineEntry = {
      id: `ptl-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: "HSE Manager",
      role: "hse_manager",
      action: "HSE Final Approval - Ready for Entry",
      status: finalStatus,
      remarks: "Badge IDs generated for all workers",
    };

    const updatedTimeline = Array.isArray(ptw.timeline)
      ? [...ptw.timeline, timelineEntry]
      : [timelineEntry];

    // 6) Prepare worker_badges rows
    const badgeRows = updatedWorkerList.map((worker) => ({
      badge_id: worker.badge_id || worker.badgeId,
      worker_name: worker.name || "Worker",
      company: contractorCompany,
      role: worker.role || "Worker",
      ptw_id: ptw.id,
      moc_id: ptw.moc_id,
      validity_start: ptw.start_datetime,
      validity_end: ptw.end_datetime,
      qr_code: worker.badge_id || worker.badgeId,
    }));

    // 7) Update PTW
    const { data: updatedPtw, error: updateError } = await supabase
      .from("ptws")
      .update({
        status: finalStatus,
        worker_list: updatedWorkerList,
        timeline: updatedTimeline,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ptwId)
      .select("*")
      .single();

    if (updateError || !updatedPtw) {
      return NextResponse.json(
        {
          success: false,
          error: updateError?.message || "Failed to update PTW",
        },
        { status: 400 }
      );
    }

    // 8) Upsert worker badges
    const { error: badgeError } = await supabase
      .from("worker_badges")
      .upsert(badgeRows, {
        onConflict: "badge_id",
      });

    if (badgeError) {
      return NextResponse.json(
        {
          success: false,
          error: badgeError.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "HSE Final Approval completed successfully",
      ptw: {
        id: updatedPtw.id,
        status: updatedPtw.status,
      },
      badges_created: badgeRows.length,
    });
  } catch (error: any) {
    console.error("HSE approval API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Server error",
      },
      { status: 500 }
    );
  }
}