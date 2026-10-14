import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Extracts the authenticated user ID from the Authorization header.
 */
async function getAuthenticatedUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];

  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) return null;
  return user.id;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('booking_id');
    if (!bookingId) {
      return NextResponse.json({ error: 'Missing booking_id' }, { status: 400 });
    }

    // Verify user owns the booking
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('user_id')
      .eq('id', bookingId)
      .maybeSingle();

    if (!booking || booking.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: review } = await supabaseAdmin
      .from('reviews')
      .select('id, rating, comment, review_text')
      .eq('booking_id', bookingId)
      .eq('user_id', userId)
      .maybeSingle();

    return NextResponse.json(review || {});
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { booking_id, rating, review_text } = body;

    if (!booking_id || !rating) {
      return NextResponse.json({ error: 'Missing booking_id or rating' }, { status: 400 });
    }

    // 1. Authenticate
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verify user owns the booking
    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from('bookings')
      .select('user_id')
      .eq('id', booking_id)
      .maybeSingle();

    if (bookingErr || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden: you can only review your own bookings' }, { status: 403 });
    }

    // 3. Upsert the review
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .upsert({
        booking_id,
        user_id: userId,
        rating: Math.min(5, Math.max(1, Number(rating))),
        review_text: review_text || '',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Reviews API Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
