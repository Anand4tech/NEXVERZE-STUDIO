import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      email,
      credits,
      amount,
    } = await req.json();

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keySecret && razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return NextResponse.json({ error: 'Invalid Razorpay payment signature.' }, { status: 400 });
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfrndplroxqkoubzstwd.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_58cgkF4Y7klvRJhcs2FvZw_4g-E1LFh';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch and update user credits
    let userRecord: any = null;
    const { data: existingUser } = await supabase
      .from('studio_users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (existingUser) {
      const newCredits = (existingUser.credits || 0) + Number(credits);
      const { data: updatedUser } = await supabase
        .from('studio_users')
        .update({ credits: newCredits })
        .eq('id', userId)
        .select()
        .single();
      userRecord = updatedUser;
    }

    // 2. Record in credit_transactions
    await supabase.from('credit_transactions').insert([
      {
        id: crypto.randomUUID(),
        user_id: userId,
        email,
        order_id: razorpay_order_id || 'order',
        payment_id: razorpay_payment_id || 'payment',
        amount_inr: amount || 0,
        credits_added: credits,
        created_at: new Date().toISOString(),
      },
    ]);

    return NextResponse.json({
      success: true,
      message: `Successfully credited ${credits} credits.`,
      user: userRecord,
    });
  } catch (err: any) {
    console.error('Verify payment error:', err);
    return NextResponse.json({ error: err?.message || 'Verification failed.' }, { status: 500 });
  }
}
