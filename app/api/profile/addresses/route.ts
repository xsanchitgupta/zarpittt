import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUser } from '@/lib/user-auth';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    if (!(await verifyUser(req, userId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!id || !userId) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    if (!(await verifyUser(req, userId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Securely delete using admin client but verify userId to be safe
    const { error } = await supabaseAdmin
      .from('addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, label, address, city, pincode, isDefault } = body;

    if (!userId || !label || !address) {
      return NextResponse.json({ error: 'Missing required address fields' }, { status: 400 });
    }

    if (!(await verifyUser(req, userId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Insert securely via admin client
    const { data, error } = await supabaseAdmin
      .from('addresses')
      .insert({
        user_id: userId,
        label,
        full_address: address,
        city: city || null,
        pincode: pincode || null,
        is_default: !!isDefault
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
