import { createClient } from "@supabase/supabase-js";
import { NextApiRequest, NextApiResponse } from "next";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query; // Get PTW ID from URL params
  const { role } = req.body; // Assuming role is passed in the body

  try {
    // Fetch the PTW from the database
    const { data: ptw, error: ptwError } = await supabase
      .from("ptws")
      .select("*")
      .eq("id", id)
      .single();

    if (ptwError || !ptw) {
      return res.status(404).json({ error: "PTW not found" });
    }

    let nextStatus: string;
    let action: string;

    // Role-based Validation
    if (
      (ptw.status === 'PENDING_SECURITY_REVIEW' && role !== 'security') ||
      (ptw.status === 'PENDING_FACILITIES_REVIEW' && role !== 'facilities') ||
      (ptw.status === 'PENDING_EFS_REVIEW' && role !== 'efs') ||
      (ptw.status === 'PENDING_HSE_APPROVAL' && role !== 'hse_manager')
    ) {
      console.error("Invalid role for this approval stage");
      return res.status(403).json({ error: "Invalid role" });
    }

    switch (ptw.status) {
      case 'PENDING_SECURITY_REVIEW':
        if (ptw.requires_facilities_review) {
          nextStatus = 'PENDING_FACILITIES_REVIEW';
          action = 'Approved by Security';
        } else if (ptw.requires_efs_review) {
          nextStatus = 'PENDING_EFS_REVIEW';
          action = 'Approved by Security';
        } else {
          nextStatus = 'PENDING_HSE_APPROVAL';
          action = 'Approved by Security';
        }
        break;

      case 'PENDING_FACILITIES_REVIEW':
        if (ptw.requires_efs_review) {
          nextStatus = 'PENDING_EFS_REVIEW';
          action = 'Approved by Facilities';
        } else {
          nextStatus = 'PENDING_HSE_APPROVAL';
          action = 'Approved by Facilities';
        }
        break;

      case 'PENDING_EFS_REVIEW':
        nextStatus = 'PENDING_HSE_APPROVAL';
        action = 'Approved by EFS';
        break;

      case 'PENDING_HSE_APPROVAL':
        nextStatus = 'READY_FOR_ENTRY';
        action = 'Approved by HSE - Ready for Entry';

        if (ptw.worker_list && ptw.worker_list.length > 0) {
          const hasExistingBadges = ptw.worker_list.some((w: any) => w.badge_id);

          if (!hasExistingBadges) {
            const workersWithBadges = ptw.worker_list.map((w: any) => ({
              ...w,
              entryStatus: 'PENDING',
              entryChecklist: [
                { id: 'ptw-area', label: 'Valid PTW & correct area', required: true, checked: false },
                { id: 'ppe', label: 'PPE checked', required: true, checked: false },
                { id: 'tools', label: 'Tools/Equipment checked', required: true, checked: false },
                { id: 'induction', label: 'Site induction confirmed', required: true, checked: false },
                { id: 'briefing', label: 'Emergency briefing confirmed', required: true, checked: false },
              ]
            }));

            const entryLogs = [{
              at: new Date().toISOString(),
              by: role || 'System',
              action: 'READY_FOR_ENTRY_INIT',
            }];

            const { error: updateError } = await supabase
              .from("ptws")
              .update({
                status: nextStatus,
                worker_list: workersWithBadges,
                entryProgress: { passed: 0, total: workersWithBadges.length },
                entryLogs
              })
              .eq("id", ptw.id);

            if (updateError) throw updateError;
          }
        }
        break;

      default:
        throw new Error("Invalid PTW status");
    }

    // Final workflow DB update
    const { error: updateError } = await supabase
      .from("ptws")
      .update({ status: nextStatus })
      .eq("id", ptw.id);

    if (updateError) throw updateError;

    // Add Timeline Entry
    await supabase.from("ptws").update({
      timeline: [...ptw.timeline, { id: `ptl-${Date.now()}`, timestamp: new Date().toISOString(), action, status: nextStatus }]
    }).eq("id", ptw.id);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Error in approve:", error);
    return res.status(500).json({ error: error.message });
  }
}