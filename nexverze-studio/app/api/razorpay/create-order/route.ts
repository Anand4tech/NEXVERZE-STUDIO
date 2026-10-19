import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(req: NextRequest) {
  try {
    const { amount, credits, planId, email, userId } = await req.json();

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({
        id: `order_${Date.now()}`,
        amount: Math.round(amount * 100),
        currency: 'INR',
        status: 'created',
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}_${userId || 'usr'}`,
      notes: {
        credits: String(credits),
        planId: planId || 'plan',
        email: email || '',
        userId: userId || '',
      },
    };

    const order = await razorpay.orders.create(options);
    return NextResponse.json({
      ...order,
      key_id: keyId,
    });
  } catch (err: any) {
    console.error('Create order error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to create Razorpay order' }, { status: 500 });
  }
}
