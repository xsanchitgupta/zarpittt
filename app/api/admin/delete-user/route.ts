import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from "@/lib/admin-auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    if (!supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Service role key not configured.' 
      }, { status: 500 });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: { user: requestingUser }, error: authError } = await adminClient.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    const { data: adminProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', requestingUser.id)
      .single();

    if (!adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target User ID is required' }, { status: 400 });
    }
    
    if (targetUserId === requestingUser.id) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }

    // Attempt to delete user from Auth (cascades to profiles on success)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(targetUserId);

    // If Auth delete fails (e.g. because the user is an orphan profile that does not exist in auth.users),
    // we perform a direct database delete on the profiles table to trigger cascade deletes and clean up.
    if (deleteError) {
      console.log(`[Delete User] Auth deletion failed: ${deleteError.message}. Attempting direct DB cleanup fallback...`);
      
      const { error: dbError } = await adminClient
        .from('profiles')
        .delete()
        .eq('id', targetUserId);

      if (dbError) {
        return NextResponse.json({ error: `Database cleanup failed: ${dbError.message}` }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
