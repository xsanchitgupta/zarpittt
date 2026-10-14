import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify the requesting user is an admin
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    if (!supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Service role key not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local' 
      }, { status: 500 });
    }

    // Use admin client (bypasses RLS) for all operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify the token and get the requesting user
    const { data: { user: requestingUser }, error: authError } = await adminClient.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Check admin role (using admin client to bypass RLS)
    const { data: adminProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', requestingUser.id)
      .single();

    if (!adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse request body
    const { email, password, full_name, phone, services_offered, salary_amount, selfie_image, aadhaar_image } = await req.json();

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
    }

    // Create the auth user with email_confirm: true so account is immediately active
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Immediately active, no verification needed
      user_metadata: {
        full_name,
        phone: phone || '',
        role: 'professional',
        avatar_url: selfie_image || '',
      },
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    if (!newUser.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Create or update profile
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id: newUser.user.id,
        email: newUser.user.email,
        role: 'professional',
        full_name,
        phone: phone || '',
        avatar_url: selfie_image || null,
        is_active: true,
        is_onboarded: true,
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    // Create provider_profile with worker_type = 'salaried' and auto-approved
    const { error: ppError } = await adminClient
      .from('provider_profiles')
      .upsert({
        user_id: newUser.user.id,
        worker_type: 'salaried',
        verification_status: 'approved',
        salary_amount: salary_amount || 0,
        services_offered: services_offered || [],
        added_by_admin: requestingUser.id,
        is_online: false,
        experience_years: 0,
        max_distance_km: 20,
        selfie_image: selfie_image || null,
        aadhaar_image: aadhaar_image || null,
      }, { onConflict: 'user_id' });

    if (ppError) {
      console.error('Provider profile creation error:', ppError);
      return NextResponse.json({ error: 'User created in auth but profile setup failed: ' + ppError.message }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        full_name,
      }
    });

  } catch (error: any) {
    console.error('Create worker error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
