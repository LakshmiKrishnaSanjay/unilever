import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const {
      checklistItems,
      finalNotes,
      completedBy,
    } = body || {};

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'PTW id is required' },
        { status: 400 }
      );
    }

    const allChecked =
      checklistItems &&
      Object.values(checklistItems).every(Boolean);

    if (!allChecked) {
      return NextResponse.json(
        { success: false, error: 'All checklist items must be completed' },
        { status: 400 }
      );
    }

    if (!finalNotes?.trim()) {
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
          error: 'Only PTWs in WORK_COMPLETED status can be submitted for closure',
        },
        { status: 400 }
      );
    }

    const timeline = Array.isArray(ptw.timeline) ? [...ptw.timeline] : [];

    timeline.push({
      id: `ptl-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: completedBy || 'Contractor Supervisor',
      role: 'contractor_supervisor',
      action: 'Supervisor Closure Submitted',
      status: 'PENDING_FACILITIES_CLOSURE',
      remarks: finalNotes,
    });

    const { error: updateError } = await supabase
      .from('ptws')
      .update({
        status: 'PENDING_FACILITIES_CLOSURE',
        supervisor_closure_checklist: checklistItems,
        supervisor_closure_notes: finalNotes.trim(),
        supervisor_closure_completed_at: new Date().toISOString(),
        supervisor_closure_completed_by: completedBy || 'Contractor Supervisor',
        timeline,
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Unexpected error' },
      { status: 500 }
    );
  }
}