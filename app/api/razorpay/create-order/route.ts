import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { verifyUser } from '@/lib/user-auth';
import { BookingService } from '@/lib/services/booking-service';

export async function POST(req: NextRequest) {
  try {
    const { cart, couponCode, receipt, userId } = await req.json();

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json({ error: 'Cart is empty or invalid' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Verify user is authenticated
    if (!(await verifyUser(req, userId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Securely calculate pricing server-side
    const { total } = await BookingService.calculateSecurePrice(cart, couponCode);

    if (total <= 0) {
      return NextResponse.json({ error: 'Order total must be greater than zero' }, { status: 400 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const options = {
      amount: Math.round(total * 100), // amount in smallest currency unit (paise)
      currency: 'INR',
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('[Razorpay Create Order]', error);
    // Don't leak internal/gateway error details to the client
    return NextResponse.json({ error: 'Could not initialize payment. Please try again.' }, { status: 500 });
  }
}

