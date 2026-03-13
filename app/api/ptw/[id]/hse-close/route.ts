import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

type ChecklistItems = {
  work_completed?: boolean;
  area_cleaned?: boolean;
  tools_removed?: boolean;
  safety_verified?: boolean;
  documentation_complete?: boolean;
};

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const notes = body?.notes || '';
    const checklistItems: ChecklistItems = body?.checklistItems || {};
    const completedBy = body?.completedBy || 'HSE Manager';

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'PTW id is required' },
        { status: 400 }
      );
    }

    if (!notes.trim()) {
      return NextResponse.json(
        { success: false, error: 'HSE closure notes are required' },
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

    if (ptw.status !== 'PENDING_HSE_CLOSURE') {
      return NextResponse.json(
        { success: false, error: 'PTW is not in PENDING_HSE_CLOSURE status' },
        { status: 400 }
      );
    }

    const timeline = Array.isArray(ptw.timeline) ? [...ptw.timeline] : [];
    timeline.push({
      id: `ptl-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: completedBy,
      role: 'hse_manager',
      action: 'HSE Closure Approved',
      status: 'CLOSED',
      remarks: notes.trim(),
    });

    const { error: updateError } = await supabase
      .from('ptws')
      .update({
        status: 'CLOSED',
        hse_closure_notes: notes.trim(),
        hse_closure_completed_at: new Date().toISOString(),
        hse_closure_completed_by: completedBy,
        sent_back_to_role: null,
        sent_back_reason: null,
        sent_back_from_stage: null,
        timeline,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      nextStatus: 'CLOSED',
      message: 'PTW closed successfully.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Unexpected error' },
      { status: 500 }
    );
  }
}