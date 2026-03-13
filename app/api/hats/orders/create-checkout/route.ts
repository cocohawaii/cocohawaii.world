import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/hats/orders/create-checkout
 * Creates a pending hat order and a SumUp checkout for the card widget.
 * Returns checkoutId for SumUpCard.mount().
 *
 * Body: hatId (wix_id), name, email, mobile, shippingAddress, shippingCity,
 *       shippingPostalCode, shippingCountry, shippingOption, shippingPrice,
 *       hatPrice, totalPrice, hatTitle, hatSubtitle, prReferralId?
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.SUMUP_API_KEY;
    const merchantCode = process.env.SUMUP_MERCHANT_CODE;
    if (!apiKey || !merchantCode) {
      const missing = [!apiKey && 'SUMUP_API_KEY', !merchantCode && 'SUMUP_MERCHANT_CODE'].filter(Boolean);
      return NextResponse.json(
        { success: false, error: `Payment configuration missing: add ${missing.join(', ')} to .env.local` },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      hatId,
      name,
      email,
      mobile,
      shippingAddress,
      shippingCity,
      shippingPostalCode,
      shippingCountry,
      shippingOption,
      shippingPrice,
      hatPrice,
      totalPrice,
      hatTitle,
      hatSubtitle,
      prReferralId,
    } = body;

    if (!hatId || !hatTitle) {
      return NextResponse.json(
        { success: false, error: 'Hat is required' },
        { status: 400 }
      );
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const emailLower = email.toLowerCase().trim();
    const amount = Number(totalPrice) || Number(hatPrice) || 0;
    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid total amount' },
        { status: 400 }
      );
    }

    // Verify hat exists and is not sold
    const { data: hat, error: hatErr } = await admin
      .from('hats')
      .select('wix_id, title, is_sold, is_active')
      .eq('wix_id', hatId)
      .single();

    if (hatErr || !hat) {
      return NextResponse.json(
        { success: false, error: 'Hat not found' },
        { status: 400 }
      );
    }

    if (hat.is_sold === true) {
      return NextResponse.json(
        { success: false, error: 'This hat has already been sold' },
        { status: 409 }
      );
    }

    // Generate order_id
    let orderId = 'CHhatOrder1';
    const { data: existing } = await admin.from('hat_orders').select('order_id').limit(1000);
    if (existing && existing.length > 0) {
      let maxNum = 0;
      existing.forEach((o: { order_id?: string }) => {
        const m = (o.order_id || '').match(/CHhatOrder(\d+)/);
        if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
      });
      if (maxNum > 0) orderId = `CHhatOrder${maxNum + 1}`;
    }

    // Insert pending order (payment_status: pending)
    const { data: order, error: orderErr } = await admin
      .from('hat_orders')
      .insert({
        wix_id: randomUUID(),
        order_id: orderId,
        customer_name: (name || '').trim() || '',
        customer_email: emailLower,
        customer_mobile: (mobile || '').trim() || '',
        customer_address: (shippingAddress || '').trim() || '',
        shipping_city: (shippingCity || '').trim() || '',
        shipping_postal_code: (shippingPostalCode || '').trim() || '',
        shipping_country: (shippingCountry || '').trim() || '',
        hat_title: hatTitle,
        hat_subtitle: hatSubtitle || null,
        hat_price: Number(hatPrice) || 0,
        shipping_cost: Number(shippingPrice) || 0,
        total_price: amount,
        shipping_option: shippingOption || null,
        pr_referral_id: prReferralId || null,
        hat_wix_id: hatId,
        payment_status: 'pending',
        order_created_on: new Date().toISOString(),
      })
      .select('wix_id, order_id')
      .single();

    if (orderErr || !order) {
      console.error('Hat order insert error:', orderErr);
      return NextResponse.json(
        { success: false, error: 'Failed to create order. Please try again.' },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cocohawaii.world';
    const paymentReturnUrl = `${baseUrl.replace(/\/$/, '')}/member/collection-orders?payment_return=1`;

    // SumUp sandbox: amount 11 always fails by design. Use a different amount for testing.
    if (amount === 11) {
      console.warn('[SumUp] Amount 11 always fails in sandbox. Use a different amount for testing.');
    }
    const sumupRes = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        merchant_code: merchantCode,
        amount,
        currency: 'EUR',
        checkout_reference: order.wix_id,
        description: `Hat: ${hatTitle}`,
        return_url: paymentReturnUrl,
        redirect_url: paymentReturnUrl,
      }),
    });

    let sumupData: Record<string, unknown>;
    try {
      sumupData = (await sumupRes.json()) as Record<string, unknown>;
    } catch {
      sumupData = { raw: await sumupRes.text() };
    }

    if (!sumupRes.ok) {
      console.error('SumUp checkout create error:', sumupRes.status, JSON.stringify(sumupData));
      await admin.from('hat_orders').delete().eq('wix_id', order.wix_id);
      const msg =
        (sumupData.error_message as string) ||
        (sumupData.message as string) ||
        (sumupData.error as string) ||
        (sumupData.detail as string) ||
        (Array.isArray(sumupData.errors)
          ? (sumupData.errors as { message?: string }[]).map((e) => e.message).filter(Boolean).join('; ')
          : null) ||
        (typeof sumupData === 'object' ? JSON.stringify(sumupData) : String(sumupData));
      return NextResponse.json(
        { success: false, error: msg || 'Payment setup failed. Please try again.' },
        { status: 500 }
      );
    }

    const checkoutId = sumupData.id as string | undefined;
    if (!checkoutId) {
      await admin.from('hat_orders').delete().eq('wix_id', order.wix_id);
      return NextResponse.json(
        { success: false, error: 'Invalid payment response' },
        { status: 500 }
      );
    }

    await admin
      .from('hat_orders')
      .update({ sumup_checkout_id: checkoutId })
      .eq('wix_id', order.wix_id);

    return NextResponse.json({
      success: true,
      checkoutId,
      orderId: order.order_id,
      wixId: order.wix_id,
      totalPaid: amount,
    });
  } catch (error: unknown) {
    console.error('Hat create checkout error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: msg || 'Failed to create checkout' },
      { status: 500 }
    );
  }
}
