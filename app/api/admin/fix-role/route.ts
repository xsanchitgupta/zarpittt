import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from "@/lib/admin-auth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role')
      .eq('email', email)
      .maybeSingle();

    if (fetchError || !profile) {
      return NextResponse.json({ error: 'User profile not found in database. Make sure you have signed up first.' }, { status: 404 });
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', profile.id);

    if (updateError) throw updateError;

    return NextResponse.json({ 
      success: true, 
      message: `User ${profile.full_name} (${email}) is now an Admin.`,
      profile
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
