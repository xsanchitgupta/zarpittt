import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUser } from '@/lib/user-auth';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, label, full_address, house_no, building_name, landmark, latitude, longitude, city, pincode } = body;

    if (!userId || !full_address) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    if (!(await verifyUser(req, userId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Embed detailed fields into full_address to avoid schema conflicts
    const details = { house_no, building_name, landmark };
    const enrichedAddress = `[D:${JSON.stringify(details)}] ${full_address}`;

    const { data, error } = await supabaseAdmin.from('addresses').insert({
      user_id: userId,
      label: label || 'Home',
      full_address: enrichedAddress,
      latitude: latitude || null,
      longitude: longitude || null,
      city: city || 'Greater Noida',
      pincode: pincode || '',
    }).select().single();

    if (error) {
      console.error('[API] Address insert error:', error);
      throw error;
    }

    // Parse it back for the response so the frontend gets the structured fields
    return NextResponse.json({
      ...data,
      house_no,
      building_name,
      landmark,
      full_address: full_address // Return the original clean address for display
    });
  } catch (err: any) {
    console.error('[API] Address route error:', err);
    return NextResponse.json({ error: 'Could not save address. Please try again.' }, { status: 500 });
  }
}
