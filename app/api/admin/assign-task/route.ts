import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID as uuidv4 } from 'crypto';
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Auto-assign a booking to the best available worker.
 * Priority: Salaried workers first, then commission workers.
 * 
 * NEW: Uses real estimated_duration_minutes + buffer time for overlap detection.
 * NEW: Detects consecutive same-customer bookings and groups them under a shared group_id,
 *       assigning them to the same worker. Buffer applies only at the end of a group chain.
 */

/** Parse a time string like "10:00 AM" or "14:00" into total minutes from midnight */
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr || timeStr === 'Instant (Now)') return -1;
  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    const [t, meridiem] = timeStr.split(' ');
    const [h, m] = t.split(':').map(Number);
    let hours = meridiem === 'PM' && h !== 12 ? h + 12 : meridiem === 'AM' && h === 12 ? 0 : h;
    return hours * 60 + (m || 0);
  }
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

export async function POST(req: Request) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Auth check — any logged-in user can trigger (it's called from checkout)
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    const body = await req.json();
    const bookingId = body.bookingId || body.booking_id;

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
    }

    console.log('[assign-task] Starting assignment for booking:', bookingId);

    // 1. Fetch the booking with duration info
    const { data: booking, error: bookingErr } = await adminClient
      .from('bookings')
      .select('id, user_id, status, professional_id, scheduled_date, scheduled_time, estimated_duration_minutes, group_id')
      .eq('id', bookingId)
      .single();

    if (bookingErr || !booking) {
      console.error('[assign-task] Booking not found:', bookingErr);
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.professional_id) {
      return NextResponse.json({ success: false, reason: 'already_assigned' });
    }

    if (!['pending', 'scheduled'].includes(booking.status)) {
      return NextResponse.json({ success: false, reason: 'invalid_status' });
    }

    // 3. Get system buffer time
    const { data: bufferSetting } = await adminClient
      .from('system_settings')
      .select('value')
      .eq('key', 'order_buffer_minutes')
      .single();
    
    const ORDER_BUFFER = parseInt(bufferSetting?.value || '30');
    const bookingDuration = booking.estimated_duration_minutes || 60;

    // 4. Standard assignment — Get all approved salaried workers
    const { data: salariedWorkers, error: workersErr } = await adminClient
      .from('provider_profiles')
      .select('user_id')
      .eq('worker_type', 'salaried')
      .eq('verification_status', 'approved');

    if (workersErr) {
      console.error('[assign-task] Failed to fetch salaried workers:', workersErr);
      return NextResponse.json({ error: 'Failed to fetch workers' }, { status: 500 });
    }

    if (!salariedWorkers || salariedWorkers.length === 0) {
      return NextResponse.json({ success: false, reason: 'no_salaried_workers' });
    }

    const workerIds = salariedWorkers.map(w => w.user_id);
    const workerIdsStr = workerIds.join(',');
    const orQuery = workerIdsStr ? `professional_id.is.null,professional_id.in.(${workerIdsStr})` : `professional_id.is.null`;

    // 5. Fetch all active bookings for this date to build userBlocks (mirroring availability logic)
    const { data: allDayBookings } = await adminClient
      .from('bookings')
      .select('id, user_id, professional_id, status, scheduled_date, scheduled_time, estimated_duration_minutes, group_id')
      .eq('scheduled_date', booking.scheduled_date)
      .in('status', ['pending', 'confirmed', 'en_route', 'started'])
      .or(orQuery);

    const activeBookings = allDayBookings || [];
    if (!activeBookings.find(b => b.id === bookingId)) {
        activeBookings.push(booking); // Ensure current booking is included
    }

    const bookingsByUser: Record<string, typeof activeBookings> = {};
    for (const b of activeBookings) {
      if (!bookingsByUser[b.user_id]) bookingsByUser[b.user_id] = [];
      bookingsByUser[b.user_id].push(b);
    }

    const userBlocks: { id: string, userId: string, profId: string | null, start: number, end: number, status: string, groupId: string | null }[] = [];
    let myBlock: any = null;

    for (const uid in bookingsByUser) {
      const userBookings = bookingsByUser[uid];
      userBookings.sort((a, b) => parseTimeToMinutes(a.scheduled_time) - parseTimeToMinutes(b.scheduled_time));

      let currentEnd = -1;
      let currentJobEnd = -1;
      for (let i = 0; i < userBookings.length; i++) {
        const b = userBookings[i];
        let bStart = parseTimeToMinutes(b.scheduled_time);
        if (bStart === -1) {
          const now = new Date();
          bStart = now.getHours() * 60 + now.getMinutes();
        }

        let actualStart: number;
        if (currentEnd === -1 || bStart > currentEnd) {
          actualStart = bStart;
        } else {
          actualStart = currentJobEnd;
        }

        const duration = b.estimated_duration_minutes || 60;
        const actualEndWithoutBuffer = actualStart + duration;

        // Only apply buffer on the last booking of a contiguous sequence for this user
        const isLastInSequence = (i === userBookings.length - 1) || 
          (parseTimeToMinutes(userBookings[i + 1].scheduled_time) > (actualEndWithoutBuffer + ORDER_BUFFER));

        const actualBuffer = isLastInSequence ? ORDER_BUFFER : 0;
        const actualEndWithBuffer = actualEndWithoutBuffer + actualBuffer;

        const block = { 
          id: b.id, 
          userId: uid, 
          profId: b.professional_id, 
          start: actualStart, 
          end: actualEndWithBuffer, 
          status: b.status, 
          groupId: b.group_id 
        };
        userBlocks.push(block);
        
        if (b.id === bookingId) {
            myBlock = block;
        }

        currentEnd = actualEndWithBuffer;
        currentJobEnd = actualEndWithoutBuffer;
      }
    }

    if (!myBlock) {
        return NextResponse.json({ error: 'Failed to process booking block' }, { status: 500 });
    }

    // 6. Check for grouping and overlapping busy workers
    let groupWorkerId: string | null = null;
    let groupId: string | null = booking.group_id || null;
    const busyWorkerIds = new Set<string>();

    for (const block of userBlocks) {
        if (block.id === bookingId) continue;

        // Grouping: If same user and blocks touch or overlap
        if (block.userId === booking.user_id) {
            const isContiguous = block.end >= myBlock.start && block.start <= myBlock.end;
            if (isContiguous && block.profId) {
                groupWorkerId = block.profId;
                
                // Set up group ID
                if (!groupId) {
                    groupId = block.groupId || crypto.randomUUID();
                    if (!block.groupId) {
                        await adminClient.from('bookings').update({ group_id: groupId }).eq('id', block.id);
                    }
                }
                console.log(`[assign-task] GROUPING: Found contiguous booking ${block.id}, assigning to same worker ${groupWorkerId}`);
            }
        }

        // Busy workers: If different block overlaps with myBlock
        if (block.profId) {
            if (block.status === 'en_route' || block.status === 'started') {
                busyWorkerIds.add(block.profId); // Currently active on a job
            } else if (block.start < myBlock.end && myBlock.start < block.end) {
                busyWorkerIds.add(block.profId); // Overlapping future job
            }
        }
    }

    // 7. If grouped, assign directly to the same worker
    if (groupWorkerId) {
      const { error: updateErr } = await adminClient
        .from('bookings')
        .update({ 
          professional_id: groupWorkerId, 
          status: 'confirmed',
          group_id: groupId 
        })
        .eq('id', bookingId)
        .is('professional_id', null);

      if (updateErr) {
        console.error('[assign-task] Grouped assignment failed:', updateErr);
        return NextResponse.json({ error: 'Grouped assignment failed' }, { status: 500 });
      }

      console.log(`[assign-task] ✅ Grouped booking ${bookingId} with worker ${groupWorkerId} (group: ${groupId})`);
      return NextResponse.json({ 
        success: true, 
        worker_id: groupWorkerId,
        group_id: groupId,
        grouped: true,
        message: 'Grouped with contiguous booking, same worker assigned'
      });
    }

    console.log('[assign-task] Busy workers:', Array.from(busyWorkerIds));

    // 8. Find available workers
    const availableWorkers = workerIds.filter(id => !busyWorkerIds.has(id));

    if (availableWorkers.length === 0) {
      console.log('[assign-task] All salaried workers are busy');
      return NextResponse.json({ success: false, reason: 'all_salaried_busy' });
    }

    // 8. Fairness: pick worker with fewest jobs today
    let bestWorker = availableWorkers[0];
    
    if (availableWorkers.length > 1) {
      const { data: todayBookings } = await adminClient
        .from('bookings')
        .select('professional_id')
        .in('professional_id', availableWorkers)
        .eq('scheduled_date', booking.scheduled_date)
        .in('status', ['confirmed', 'en_route', 'started', 'completed']);

      const countMap: Record<string, number> = {};
      availableWorkers.forEach(id => { countMap[id] = 0; });
      todayBookings?.forEach(b => {
        if (b.professional_id) countMap[b.professional_id] = (countMap[b.professional_id] || 0) + 1;
      });

      bestWorker = availableWorkers.reduce((best, curr) => 
        (countMap[curr] || 0) < (countMap[best] || 0) ? curr : best
      );
    }

    console.log('[assign-task] Assigning to worker:', bestWorker);

    // 9. Atomic assignment
    const { error: updateErr } = await adminClient
      .from('bookings')
      .update({ 
        professional_id: bestWorker, 
        status: 'confirmed' 
      })
      .eq('id', bookingId)
      .is('professional_id', null);

    if (updateErr) {
      console.error('[assign-task] Failed to assign:', updateErr);
      return NextResponse.json({ error: 'Assignment failed: ' + updateErr.message }, { status: 500 });
    }

    // Verify assignment (race condition check)
    const { data: verify } = await adminClient
      .from('bookings')
      .select('professional_id')
      .eq('id', bookingId)
      .single();

    if (verify?.professional_id !== bestWorker) {
      return NextResponse.json({ success: false, reason: 'race_condition' });
    }

    console.log('[assign-task] ✅ Successfully assigned booking', bookingId, 'to worker', bestWorker);

    return NextResponse.json({ 
      success: true, 
      worker_id: bestWorker,
      message: 'Salaried worker assigned successfully'
    });

  } catch (error: any) {
    console.error('[assign-task] Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
