import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUser } from '@/lib/user-auth';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * Extracts the authenticated user ID from the request's Authorization header.
 * Returns null if the token is missing or invalid.
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

/**
 * Verifies the user is a participant in the booking (either the customer or the assigned professional).
 */
async function verifyBookingParticipant(userId: string, bookingId: string): Promise<boolean> {
  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .select('user_id, professional_id')
    .eq('id', bookingId)
    .maybeSingle();

  if (error || !booking) return false;
  return booking.user_id === userId || booking.professional_id === userId;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('booking_id');

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing booking_id parameter' }, { status: 400 });
    }

    // 1. Authenticate the user
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verify user is a participant in this booking (owner or assigned professional)
    const isParticipant = await verifyBookingParticipant(userId, bookingId);
    if (!isParticipant) {
      // Also allow admins
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data: profile } = await adminClient.from('profiles').select('role').eq('id', userId).single();
      if (!profile || profile.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: not a participant in this booking' }, { status: 403 });
      }
    }

    // 3. Fetch messages
    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .select('*, sender:sender_id(full_name)')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Chat API Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { booking_id, sender_id, message } = body;

    if (!booking_id || !sender_id || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Authenticate the user
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verify sender_id matches the authenticated user (prevent impersonation)
    if (userId !== sender_id) {
      return NextResponse.json({ error: 'Forbidden: sender_id does not match authenticated user' }, { status: 403 });
    }

    // 3. Verify user is a participant in this booking
    const isParticipant = await verifyBookingParticipant(userId, booking_id);
    if (!isParticipant) {
      return NextResponse.json({ error: 'Forbidden: not a participant in this booking' }, { status: 403 });
    }

    // 4. Insert the message
    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .insert({ booking_id, sender_id, message })
      .select()
      .single();

    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Chat API Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
