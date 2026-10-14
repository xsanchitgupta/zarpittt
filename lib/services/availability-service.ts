import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALL_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
  '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM'
];

/** Parse "09:00 AM" → minutes from midnight (540) */
export function parseSlotToMinutes(slot: string): number {
  const [timePart, meridiem] = slot.split(' ');
  const [h, m] = timePart.split(':').map(Number);
  let hours = h;
  if (meridiem === 'PM' && h !== 12) hours += 12;
  if (meridiem === 'AM' && h === 12) hours = 0;
  return hours * 60 + (m || 0);
}

/** Parse various time formats to minutes from midnight */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr || timeStr === 'Instant (Now)') return -1;
  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    return parseSlotToMinutes(timeStr);
  }
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

export class AvailabilityService {
  /**
   * Checks if a specific time slot on a specific date is available for a given duration.
   * Returns true if available, false if not.
   */
  static async isSlotAvailable(date: string, timeSlot: string, durationMinutes: number): Promise<boolean> {
    if (timeSlot === 'Instant (Now)') return true; // Currently allowing Instant (Now) without capacity check

    const { slots, error } = await this.getAvailability(date, durationMinutes);
    if (error) {
      console.error('[AvailabilityService] Error checking availability:', error);
      return false; // Fail safe
    }
    
    const slot = slots.find(s => s.time === timeSlot);
    return slot ? slot.available : false;
  }

  /**
   * Generates the availability for all slots on a given date for a required duration.
   */
  static async getAvailability(date: string, durationMinutes: number) {
    try {
      // 0. Check if the date is marked as sold out / worker leave date
      const { data: setting } = await supabaseAdmin
        .from('system_settings')
        .select('value')
        .eq('key', 'soldout_dates')
        .maybeSingle();

      if (setting && setting.value) {
        let dates: string[] = [];
        try {
          dates = JSON.parse(setting.value);
          if (!Array.isArray(dates)) {
            dates = setting.value.split(',').map((d: string) => d.trim()).filter(Boolean);
          }
        } catch {
          dates = setting.value.split(',').map((d: string) => d.trim()).filter(Boolean);
        }

        if (dates.includes(date)) {
          const slots = ALL_SLOTS.map(time => ({ 
            time, 
            available: false, 
            reason: 'sold', 
            freeWorkers: 0 
          }));
          return { slots, totalWorkers: 0 };
        }
      }

      // 1. Get all approved salaried workers
      const { data: salariedWorkers, error: workersErr } = await supabaseAdmin
        .from('provider_profiles')
        .select('user_id')
        .eq('worker_type', 'salaried')
        .eq('verification_status', 'approved');

      if (workersErr) {
        throw new Error('Failed to fetch workers');
      }

      // If no salaried workers exist, all slots are available (no capacity constraint)
      if (!salariedWorkers || salariedWorkers.length === 0) {
        const slots = ALL_SLOTS.map(time => ({ time, available: true }));
        return { slots, totalWorkers: 0 };
      }

      const workerIds = salariedWorkers.map(w => w.user_id);

      // 2. Get all active bookings for this date
      const workerIdsStr = workerIds.length > 0 ? workerIds.join(',') : '';
      const orQuery = workerIdsStr ? `professional_id.is.null,professional_id.in.(${workerIdsStr})` : `professional_id.is.null`;

      const { data: bookings } = await supabaseAdmin
        .from('bookings')
        .select('user_id, professional_id, scheduled_time, estimated_duration_minutes, status')
        .eq('scheduled_date', date)
        .in('status', ['pending', 'confirmed', 'en_route', 'started'])
        .or(orQuery);

      const activeBookings = bookings || [];

      // 3. Pre-process bookings: Group by user_id and stack consecutive bookings
      const userBlocks: { start: number, end: number }[] = [];
      const bookingsByUser: Record<string, typeof activeBookings> = {};
      for (const b of activeBookings) {
        if (!bookingsByUser[b.user_id]) bookingsByUser[b.user_id] = [];
        bookingsByUser[b.user_id].push(b);
      }

      const ORDER_BUFFER = 30; // System buffer time

      for (const uid in bookingsByUser) {
        const userBookings = bookingsByUser[uid];
        // Sort by scheduled time
        userBookings.sort((a, b) => {
          const t1 = parseTimeToMinutes(a.scheduled_time);
          const t2 = parseTimeToMinutes(b.scheduled_time);
          return t1 - t2;
        });

        let currentEnd = -1;
        let currentJobEnd = -1;
        for (let i = 0; i < userBookings.length; i++) {
          const b = userBookings[i];
          let bStart = parseTimeToMinutes(b.scheduled_time);
          if (bStart === -1) {
            // Instant booking: start from now
            const now = new Date();
            bStart = now.getHours() * 60 + now.getMinutes();
          }

          // If stacked with previous booking for same user
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

          userBlocks.push({ start: actualStart, end: actualEndWithBuffer });
          
          currentEnd = actualEndWithBuffer;
          currentJobEnd = actualEndWithoutBuffer;
        }
      }

      // 4. For each slot, check if W workers can handle existing blocks + new slot block
      const maxWorkers = workerIds.length;

      const slots = ALL_SLOTS.map(slotTime => {
        const slotStart = parseSlotToMinutes(slotTime);
        const slotEnd = slotStart + durationMinutes + ORDER_BUFFER; // Include buffer for new booking

        // Create a test block array including existing and the proposed new booking
        const allBlocks = [...userBlocks, { start: slotStart, end: slotEnd }];
        
        // Calculate max overlap of intervals
        const events: { time: number, type: 1 | -1 }[] = [];
        for (const block of allBlocks) {
          events.push({ time: block.start, type: 1 });  // +1 when a job starts
          events.push({ time: block.end, type: -1 });   // -1 when a job ends
        }

        // Sort events: by time ascending. If times are equal, process end (-1) before start (1)
        events.sort((a, b) => {
          if (a.time === b.time) return a.type - b.type;
          return a.time - b.time;
        });

        let currentOverlap = 0;
        let maxOverlap = 0;
        for (const ev of events) {
          currentOverlap += ev.type;
          if (currentOverlap > maxOverlap) {
            maxOverlap = currentOverlap;
          }
        }

        // If maximum simultaneous jobs > salaried workers, we don't have capacity
        const available = maxOverlap <= maxWorkers;

        return {
          time: slotTime,
          available,
          reason: !available ? 'sold' : undefined,
          freeWorkers: Math.max(0, maxWorkers - (maxOverlap - 1))
        };
      });

      // 5. Filter slots for today (past slots are unavailable)
      const todayStr = new Date().toISOString().split('T')[0];
      if (date === todayStr) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const minBookableMinutes = currentMinutes + 60; // At least 1 hour from now

        for (const slot of slots) {
          const slotMinutes = parseSlotToMinutes(slot.time);
          if (slotMinutes < minBookableMinutes) {
            slot.available = false;
            slot.reason = 'past';
          }
        }
      }

      return { slots, totalWorkers: maxWorkers };
    } catch (error: any) {
      return { slots: [], error: error.message };
    }
  }
}
