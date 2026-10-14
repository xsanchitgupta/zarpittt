import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * Public, read-only endpoint returning ONLY the fields the checkout page needs
 * to estimate a booking's duration for slot availability.
 * No prices, no PII — safe to call without auth (replaces an accidental
 * call to the admin-only /api/admin/services endpoint).
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('services')
      .select('id, duration_minutes, variant_durations')
      .limit(500);

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    console.error('[API] /services/durations failed:', err);
    // Non-fatal for the client (it falls back to a default estimate)
    return NextResponse.json([], { status: 200 });
  }
}
