import { createClient } from '@supabase/supabase-js';

/**
 * Validates the Authorization header of an incoming request.
 * Returns true if the request was made by the user whose ID matches `targetUserId` 
 * OR if the user holds the 'admin' role.
 */
export async function verifyUser(req: Request, targetUserId: string): Promise<boolean> {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.warn('[UserAuth] Missing or invalid Authorization header');
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
      console.warn('[UserAuth] Invalid token or user not found:', userError?.message);
      return false;
    }

    // Allow if the requesting user matches the target user
    if (user.id === targetUserId) {
      return true;
    }

    // Otherwise, check if the requesting user is an admin
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
      return false;
    }

    if (profile.role === 'admin') {
      return true;
    }

    console.warn(`[UserAuth] Unauthorized access attempt by user ${user.id} to resource owned by ${targetUserId}`);
    return false;
  } catch (err) {
    console.error('[UserAuth] Verification error:', err);
    return false;
  }
}
