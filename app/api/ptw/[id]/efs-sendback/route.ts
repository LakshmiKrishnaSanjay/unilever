import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const reason = body?.reason?.trim();

    if (!id) {
      return NextResponse.json({ success: false, error: 'PTW id is required' }, { status: 400 });
    }

    if (!reason) {
      return NextResponse.json({ success: false, error: 'Reason is required' }, { status: 400 });
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

    const timeline = Array.isArray(ptw.timeline) ? [...ptw.timeline] : [];

    timeline.push({
      id: `ptl-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: 'EFS',
      role: 'efs',
      action: 'Sent Back by EFS',
      status: 'SENT_BACK',
      remarks: reason,
    });

    const { error: updateError } = await supabase
      .from('ptws')
      .update({
        status: 'SENT_BACK',
        sent_back_to_role: 'contractor_admin',
        sent_back_reason: reason,
        sent_back_from_stage : 'PENDING_EFS_REVIEW',
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Unexpected error' },
      { status: 500 }
    );
  }
}