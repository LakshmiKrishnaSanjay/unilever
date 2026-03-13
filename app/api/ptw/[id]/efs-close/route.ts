import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const notes = body?.notes || '';
    const completedBy = body?.completedBy || 'EFS Engineer';

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'PTW id is required' },
        { status: 400 }
      );
    }

    if (!notes.trim()) {
      return NextResponse.json(
        { success: false, error: 'EFS closure notes are required' },
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

    if (ptw.status !== 'PENDING_EFS_CLOSURE') {
      return NextResponse.json(
        { success: false, error: 'PTW is not in PENDING_EFS_CLOSURE status' },
        { status: 400 }
      );
    }

    const timeline = Array.isArray(ptw.timeline) ? [...ptw.timeline] : [];

    timeline.push({
      id: `ptl-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: completedBy,
      role: 'efs',
      action: 'EFS Closure Approved',
      status: 'PENDING_HSE_CLOSURE',
      remarks: notes.trim(),
    });

    const { error: updateError } = await supabase
      .from('ptws')
      .update({
        status: 'PENDING_HSE_CLOSURE',
        efs_closure_notes: notes.trim(),
        efs_closure_completed_at: new Date().toISOString(),
        efs_closure_completed_by: completedBy,
        sent_back_to_role: null,
        sent_back_reason: null,
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
      nextStatus: 'PENDING_HSE_CLOSURE',
      nextStageLabel: 'HSE Closure',
      message: 'EFS closure approved. Routed to HSE Closure.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Unexpected error' },
      { status: 500 }
    );
  }
}