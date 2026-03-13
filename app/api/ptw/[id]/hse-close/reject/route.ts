import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getReturnStage() {
  return {
    returnStatus: 'WORK_COMPLETED',
    returnStageLabel: 'Supervisor',
    sentBackFromStage: 'PENDING_HSE_CLOSURE',
  };
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const reason = body?.reason || '';
    const rejectedBy = body?.rejectedBy || 'HSE Manager';

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'PTW id is required' },
        { status: 400 }
      );
    }

    if (!reason.trim()) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason is required' },
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

    const { returnStatus, returnStageLabel, sentBackFromStage } = getReturnStage();

    const timeline = Array.isArray(ptw.timeline) ? [...ptw.timeline] : [];
    timeline.push({
      id: `ptl-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: rejectedBy,
      role: 'hse_manager',
      action: 'HSE Closure Rejected',
      status: returnStatus,
      remarks: reason.trim(),
    });

    const updatePayload: Record<string, any> = {
      status: returnStatus,
      sent_back_to_role: 'supervisor',
      sent_back_reason: reason.trim(),
      sent_back_from_stage: sentBackFromStage,
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
      returnStatus,
      returnStageLabel,
      message: `HSE closure rejected and returned to ${returnStageLabel}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Unexpected error' },
      { status: 500 }
    );
  }
}