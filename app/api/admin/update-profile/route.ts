import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/admin-auth';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * SECURITY: Only these fields can be updated through the admin profile API.
 * Prevents setting arbitrary database columns like `created_at`, `id`, etc.
 */
const ALLOWED_PROFILE_FIELDS = ['full_name', 'phone', 'email', 'avatar_url', 'is_active', 'role'];

function sanitizeUpdates(raw: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const key of ALLOWED_PROFILE_FIELDS) {
    if (key in raw) sanitized[key] = raw[key];
  }
  sanitized.updated_at = new Date().toISOString();
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

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
