import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/admin-auth';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('task_assignments')
      .select(`
        id, status, estimated_start, estimated_end, worker_type, booking_id,
        worker:profiles!worker_id(full_name, email),
        booking:bookings!booking_id(id, booking_number, address, status, subtotal, scheduled_date, scheduled_time, booking_items(service_name))
      `)
      .order('estimated_start', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const bookingId = searchParams.get('booking_id');

    if (!id || !bookingId) {
      return NextResponse.json({ error: 'Missing id or booking_id' }, { status: 400 });
    }

    // 1. Delete the assignment
    const { error: delErr } = await supabaseAdmin
      .from('task_assignments')
      .delete()
      .eq('id', id);
    if (delErr) throw delErr;

    // 2. Revert booking status
    const { error: updErr } = await supabaseAdmin
      .from('bookings')
      .update({ professional_id: null, status: 'pending' })
      .eq('id', bookingId);
    if (updErr) throw updErr;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
