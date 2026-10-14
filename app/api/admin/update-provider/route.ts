import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/admin-auth';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * SECURITY: Only these fields can be updated through the admin provider API.
 */
const ALLOWED_PROVIDER_FIELDS = [
  'verification_status', 'worker_type', 'salary_amount', 'services_offered',
  'is_online', 'experience_years', 'max_distance_km', 'selfie_image', 'aadhaar_image',
  'account_name', 'rating'
];

function sanitizeUpdates(raw: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const key of ALLOWED_PROVIDER_FIELDS) {
    if (key in raw) sanitized[key] = raw[key];
  }
  return sanitized;
}

export async function PATCH(req: Request) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId, ...rawUpdates } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
    }

    const updates = sanitizeUpdates(rawUpdates);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('provider_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
