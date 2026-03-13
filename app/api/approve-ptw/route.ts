// POST /api/approve-ptw
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { ptw_id } = await req.json();
    const { data, error } = await supabase
      .from('ptws')
      .update({ status: 'PENDING_EFS_REVIEW' })  // Transition to the next review stage
      .eq('id', ptw_id);

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Error updating PTW status' }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || 'Server error' }),
      { status: 500 }
    );
  }
}