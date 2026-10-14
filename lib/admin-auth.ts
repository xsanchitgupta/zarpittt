import { createClient } from '@supabase/supabase-js';

/**
 * Validates the Authorization header of an incoming request.
 * Returns true if the request was made by a user with the 'admin' role.
 */
export async function verifyAdmin(req: Request): Promise<boolean> {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.warn('[AdminAuth] Missing or invalid Authorization header');
      return false;
    }
    const token = authHeader.split(' ')[1];

    // Create a Supabase client that uses this specific user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` }
        }
      }
    );

    // Verify the token and get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.warn('[AdminAuth] Invalid token or user not found:', userError?.message);
      return false;
    }

    // Now check if this user is actually an admin.
    // We use the service role key to ensure we can read the profile 
    // even if RLS is overly restrictive, guaranteeing a secure server-side check.
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.warn('[AdminAuth] Failed to fetch profile for user:', user.id);
      return false;
    }

    if (profile.role !== 'admin') {
      console.warn(`[AdminAuth] Unauthorized access attempt by user ${user.id} with role ${profile.role}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[AdminAuth] Verification error:', err);
    return false;
  }
}
