import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

let cachedAdminsServer: Record<string, { isAdmin: boolean; expiry: number }> = {};

export async function checkIsAdminServer(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    let token = cookieStore.get('sb-access-token')?.value;

    if (!token) {
      for (const cookie of cookieStore.getAll()) {
        if (cookie.name.includes('auth-token') && cookie.value) {
          try {
            const rawValue = cookie.value.startsWith('%') ? decodeURIComponent(cookie.value) : cookie.value;
            const parsed = JSON.parse(rawValue);
            if (parsed?.access_token) {
              token = parsed.access_token;
              break;
            }
          } catch {
            try {
              const decoded = decodeURIComponent(cookie.value);
              const parsed = JSON.parse(decoded);
              if (parsed?.access_token) {
                token = parsed.access_token;
                break;
              }
            } catch {}
          }
        }
      }
    }

    if (!token) return false;

    // Check memory cache to avoid redundant db lookups during a single request lifecycle
    const now = Date.now();
    const cached = cachedAdminsServer[token];
    if (cached && now < cached.expiry) {
      return cached.isAdmin;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRole) {
      return false;
    }

    // 1. Verify token by calling Supabase Auth API
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`
      }
    });

    if (!userRes.ok) return false;
    const user = await userRes.json();
    if (!user?.id) return false;

    // 2. Fetch role from profiles table (use Service Role Key to guarantee bypass of RLS)
    const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}&select=role`, {
      headers: {
        'apikey': supabaseServiceRole,
        'Authorization': `Bearer ${supabaseServiceRole}`
      }
    });

    if (!profileRes.ok) return false;
    const profiles = await profileRes.json();
    const profile = profiles?.[0];
    const isAdmin = profile?.role === 'admin';

    // Cache result for 15 seconds (keeps server-side rendering snappy)
    cachedAdminsServer[token] = {
      isAdmin,
      expiry: now + 15000
    };

    return isAdmin;
  } catch (err) {
    console.error('[AdminCheckServer] Server-side admin check error:', err);
    return false;
  }
}
