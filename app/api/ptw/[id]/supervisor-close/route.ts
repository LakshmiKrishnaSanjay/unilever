import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

type ChecklistItems = {
  work_completed?: boolean;
  area_cleaned?: boolean;
  tools_removed?: boolean;
  safety_verified?: boolean;
  documentation_complete?: boolean;
};

type PTWRoutingInput = {
  requires_facilities_review: boolean | null;
  requires_efs_review: boolean | null;
  sent_back_from_stage?: string | null;
};

function getNextClosureStatus(ptw: PTWRoutingInput) {
  const requiresFacilities = ptw.requires_facilities_review === true;
  const requiresEfs = ptw.requires_efs_review === true;
  const sentBackFromStage = ptw.sent_back_from_stage || null;

  // Re-submit to the exact stage that rejected it
  if (sentBackFromStage === 'PENDING_FACILITIES_CLOSURE') {
    return {
      nextStatus: 'PENDING_FACILITIES_CLOSURE',
      nextStageLabel: 'Facilities Closure',
    };
  }

  if (sentBackFromStage === 'PENDING_EFS_CLOSURE') {
    return {
      nextStatus: 'PENDING_EFS_CLOSURE',
      nextStageLabel: 'EFS Closure',
    };
  }

  if (sentBackFromStage === 'PENDING_HSE_CLOSURE') {
    return {
      nextStatus: 'PENDING_HSE_CLOSURE',
      nextStageLabel: 'HSE Closure',
    };
  }

  // Fresh routing
  if (requiresFacilities) {
    return {
      nextStatus: 'PENDING_FACILITIES_CLOSURE',
      nextStageLabel: 'Facilities Closure',
    };
  }

  if (requiresEfs) {
    return {
      nextStatus: 'PENDING_EFS_CLOSURE',
      nextStageLabel: 'EFS Closure',
    };
  }

  return {
    nextStatus: 'PENDING_HSE_CLOSURE',
    nextStageLabel: 'HSE Closure',
  };
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const checklistItems: ChecklistItems = body?.checklistItems || {};
    const finalNotes = body?.finalNotes || '';
    const completedBy = body?.completedBy || 'Supervisor';

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'PTW id is required' },
        { status: 400 }
      );
    }

    const allChecked = Object.values(checklistItems).every(Boolean);

    if (!allChecked) {
      return NextResponse.json(
        { success: false, error: 'All checklist items must be completed' },
        { status: 400 }
      );
    }

    if (!finalNotes.trim()) {
      return NextResponse.json(
        { success: false, error: 'Final closure notes are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: ptw, error: fetchError } = await supabase
      .from('ptws')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 400 }
      );
    }

    if (!ptw) {
      return NextResponse.json(
        { success: false, error: 'PTW not found' },
        { status: 404 }
      );
    }

    if (ptw.status !== 'WORK_COMPLETED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only PTWs in WORK_COMPLETED status can be submitted for supervisor closure',
        },
        { status: 400 }
      );
    }

    const { nextStatus, nextStageLabel } = getNextClosureStatus(ptw);

    const timeline = Array.isArray(ptw.timeline) ? [...ptw.timeline] : [];

    timeline.push({
      id: `ptl-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: completedBy,
      role: 'supervisor',
      action: 'Supervisor Closure Submitted',
      status: nextStatus,
      remarks: finalNotes.trim(),
    });

    const updatePayload = {
      status: nextStatus,
      supervisor_closure_checklist: checklistItems,
      supervisor_closure_notes: finalNotes.trim(),
      supervisor_closure_completed_at: new Date().toISOString(),
      supervisor_closure_completed_by: completedBy,
      sent_back_to_role: null,
      sent_back_reason: null,
      sent_back_from_stage: null,
      timeline,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('ptws')
      .update(updatePayload)
      .eq('id', id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      nextStatus,
      nextStageLabel,
      message: `Supervisor closure submitted. Routed to ${nextStageLabel}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Unexpected error' },
      { status: 500 }
    );
  }
}