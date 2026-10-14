import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** Parse time string like "09:00 AM" or "14:30" to minutes from midnight */
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr || timeStr === 'Instant (Now)') return -1;
  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    const [timePart, meridiem] = timeStr.split(' ');
    const [hStr, mStr] = timePart.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr ? parseInt(mStr, 10) : 0;
    if (meridiem === 'PM' && h !== 12) h += 12;
    if (meridiem === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const workerId = searchParams.get('worker_id');
    const date = searchParams.get('date');

    if (!workerId || !date) {
      return NextResponse.json({ error: 'worker_id and date are required' }, { status: 400 });
    }

    // 1. Fetch system buffer
    const { data: bufferData } = await supabaseAdmin
      .from('system_settings')
      .select('value')
      .eq('key', 'order_buffer_minutes')
      .single();
    
    const bufferMinutes = bufferData?.value ? parseInt(bufferData.value, 10) : 30;

    // 2. Fetch bookings
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('id, booking_number, scheduled_time, estimated_duration_minutes, status, address, group_id, total, user_id, profile:profiles(full_name)')
      .eq('professional_id', workerId)
      .eq('scheduled_date', date)
      .neq('status', 'cancelled')
      .order('scheduled_time', { ascending: true });

    if (error) throw error;

    // 3. Group by user_id to stack consecutively
    const bookingsByUser: Record<string, any[]> = {};
    for (const b of bookings || []) {
      if (!bookingsByUser[b.user_id]) bookingsByUser[b.user_id] = [];
      bookingsByUser[b.user_id].push(b);
    }

    const processedBookings = [];

    for (const uid in bookingsByUser) {
      const userBookings = bookingsByUser[uid];
      userBookings.sort((a, b) => parseTimeToMinutes(a.scheduled_time) - parseTimeToMinutes(b.scheduled_time));

      let currentEnd = -1;
      let currentJobEnd = -1;

      for (let i = 0; i < userBookings.length; i++) {
        const b = userBookings[i];
        let bStart = parseTimeToMinutes(b.scheduled_time);
        if (bStart === -1) {
          processedBookings.push({
            ...b,
            customer_name: b.profile?.full_name || 'Customer',
            start_minutes: -1,
            duration_minutes: b.estimated_duration_minutes || 60,
            end_minutes: -1,
            end_with_buffer_minutes: -1,
            buffer_minutes: 0
          });
          continue;
        }

        const duration = b.estimated_duration_minutes || 60;

        let actualStart;
        if (currentEnd === -1 || bStart > currentEnd) {
          actualStart = bStart;
        } else {
          actualStart = currentJobEnd;
        }

        const actualEndWithoutBuffer = actualStart + duration;

        // Only apply buffer on the last booking of a contiguous sequence for this user
        const isLastInSequence = (i === userBookings.length - 1) || 
          (parseTimeToMinutes(userBookings[i + 1].scheduled_time) > (actualEndWithoutBuffer + bufferMinutes));

        const actualBuffer = isLastInSequence ? bufferMinutes : 0;
        const actualEndWithBuffer = actualEndWithoutBuffer + actualBuffer;

        processedBookings.push({
          ...b,
          customer_name: b.profile?.full_name || 'Customer',
          start_minutes: actualStart,
          duration_minutes: duration,
          end_minutes: actualEndWithoutBuffer,
          end_with_buffer_minutes: actualEndWithBuffer,
          buffer_minutes: actualBuffer
        });

        currentEnd = actualEndWithBuffer;
        currentJobEnd = actualEndWithoutBuffer;
      }
    }

    processedBookings.sort((a, b) => a.start_minutes - b.start_minutes);
    const schedule = processedBookings;

    return NextResponse.json({ 
      success: true, 
      date,
      worker_id: workerId,
      buffer_minutes: bufferMinutes,
      schedule 
    });

  } catch (err: any) {
    console.error('[professional-schedule] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
