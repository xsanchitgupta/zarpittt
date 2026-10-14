import { NextRequest, NextResponse } from 'next/server';
import { AvailabilityService } from '@/lib/services/availability-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const durationMinutes = parseInt(searchParams.get('duration_minutes') || '60');

    if (!date) {
      return NextResponse.json({ error: 'date parameter is required' }, { status: 400 });
    }

    const { slots, totalWorkers, error } = await AvailabilityService.getAvailability(date, durationMinutes);

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ 
      slots, 
      totalWorkers,
      requestedDuration: durationMinutes 
    });

  } catch (error: any) {
    console.error('[availability] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
