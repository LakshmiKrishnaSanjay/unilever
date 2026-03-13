import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const reason = body?.reason || '';
    const rejectedBy = body?.rejectedBy || 'Facilities Manager';

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

    if (ptw.status !== 'PENDING_FACILITIES_CLOSURE') {
      return NextResponse.json(
        { success: false, error: 'PTW is not in PENDING_FACILITIES_CLOSURE status' },
        { status: 400 }
      );
    }

    const timeline = Array.isArray(ptw.timeline) ? [...ptw.timeline] : [];

    timeline.push({
      id: `ptl-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: rejectedBy,
      role: 'facilities',
      action: 'Facilities Closure Rejected',
      status: 'WORK_COMPLETED',
      remarks: reason.trim(),
    });

    const { error: updateError } = await supabase
      .from('ptws')
      .update({
        status: 'WORK_COMPLETED',
        sent_back_to_role: 'supervisor',
        sent_back_reason: reason.trim(),
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
      message: 'Facilities closure rejected and returned to supervisor.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Unexpected error' },
      { status: 500 }
    );
  }
}