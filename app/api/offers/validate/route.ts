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
    const { code, subtotal, userId } = body;

    if (!code || !userId) {
      return NextResponse.json({ error: 'Missing code or userId' }, { status: 400 });
    }

    if (!(await verifyUser(req, userId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uppercaseCode = code.toUpperCase();

    // Query active coupon
    const { data: offer, error } = await supabaseAdmin
      .from('offers')
      .select('*')
      .eq('code', uppercaseCode)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !offer) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 });
    }

    // Check expiry
    const validTillDate = new Date(offer.valid_till);
    if (validTillDate < new Date()) {
      return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 });
    }

    // Check usage limits
    if (offer.usage_limit && offer.used_count >= offer.usage_limit) {
      return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 });
    }

    // Calculate discount
    let discount = 0;
    if (offer.discount_type === 'percent') {
      discount = Math.floor((subtotal * offer.discount_value) / 100);
      if (offer.max_discount) {
        discount = Math.min(discount, offer.max_discount);
      }
    } else {
      discount = offer.discount_value;
    }

    return NextResponse.json({
      success: true,
      offer: {
        id: offer.id,
        code: offer.code,
        discount_type: offer.discount_type,
        discount_value: offer.discount_value,
        max_discount: offer.max_discount,
      },
      discountAmt: discount
    });
  } catch (err: any) {
    console.error('[API] Coupon validation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
