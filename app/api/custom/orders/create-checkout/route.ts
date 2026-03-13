import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/custom/orders/create-checkout
 * Creates pending customized hat order rows and a SumUp checkout.
 * Returns checkoutId for SumUpCard.mount().
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
    const { hats, clientNotes, name, email, mobile, address, shippingPrice, shippingType, finalTotalPrice } = body;

    if (!hats || !Array.isArray(hats) || hats.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hats provided' },
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
    const customerEmail = (email || '').toLowerCase().trim();
    const amount = Number(finalTotalPrice) || 0;
    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid total amount' },
        { status: 400 }
      );
    }

    let phoneCode = '';
    let phoneNumber = (mobile || '').trim();
    if (phoneNumber) {
      const m = phoneNumber.match(/^(\+\d{1,4})\s*(.+)$/);
      if (m) {
        phoneCode = m[1];
        phoneNumber = m[2];
      } else {
        phoneCode = '+1';
      }
    }

    const customerName = (name || '').trim() || '';
    const customerAddress = (address || '').trim() || '';

    let groupOrderId = 'CHCustomOrder1';
    const { data: existing } = await admin.from('customized_hat_orders').select('group_order_id').limit(1000);
    if (existing && existing.length > 0) {
      let maxNum = 0;
      existing.forEach((o: { group_order_id?: string }) => {
        const m = (o.group_order_id || '').match(/CHCustomOrder(\d+)/);
        if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
      });
      if (maxNum > 0) groupOrderId = `CHCustomOrder${maxNum + 1}`;
    }

    // Insert pending order rows (one per hat)
    for (const hat of hats) {
      const emb = hat.embellishments || {};
      const basePrice = hat.rawHatPrice || 0;
      const indvTotal = basePrice + (emb.artPrice || 0) + (emb.preciousStonesPrice || 0) + (emb.jewelryPrice || 0) + (emb.fabricPrice || 0);

      const row = {
        group_order_id: groupOrderId,
        hat_form: Array.isArray(hat.hatForm) ? hat.hatForm : [hat.hatForm || ''],
        hat_color_name: hat.hatColorName || '',
        hat_product_image: hat.hatProductImage || '',
        raw_hat_price: basePrice,
        raw_hat_id: hat.rawHatId || hat._id,
        art: emb.art || '',
        art_colors: emb.artColors || '',
        art_description: emb.artDescription || '',
        precious_stones: emb.preciousStones || '',
        precious_stone_type: emb.preciousStoneType || '',
        jewelry: emb.jewelry || '',
        jewelry_type: emb.jewelryType || '',
        fabric: emb.fabric || '',
        notes: emb.notes || '',
        birth_date: emb.birthDate || '',
        client_description: clientNotes || '',
        indv_raw_hat_n_accessory_total_live_price: indvTotal,
        email: customerEmail,
        name: customerName,
        mobile: phoneNumber,
        phone_code: phoneCode,
        address: customerAddress,
        shipping_price: Number(shippingPrice) || 0,
        shipping_type: shippingType || '',
        final_total_price: amount,
        payment_method: 'Card (SumUp)',
        order_paid: false,
        payment_status: 'pending',
        order_created_on: new Date().toISOString(),
      };

      const { error } = await admin.from('customized_hat_orders').insert(row);
      if (error) {
        console.error('Custom order insert error:', error);
        await admin.from('customized_hat_orders').delete().eq('group_order_id', groupOrderId);
        return NextResponse.json(
          { success: false, error: 'Failed to create order. Please try again.' },
          { status: 500 }
        );
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cocohawaii.world';
    const paymentReturnUrl = `${baseUrl.replace(/\/$/, '')}/member/custom-orders?payment_return=1`;

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
        checkout_reference: groupOrderId,
        description: `Custom hat order: ${hats.length} hat(s)`,
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
      await admin.from('customized_hat_orders').delete().eq('group_order_id', groupOrderId);
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
      await admin.from('customized_hat_orders').delete().eq('group_order_id', groupOrderId);
      return NextResponse.json(
        { success: false, error: 'Invalid payment response' },
        { status: 500 }
      );
    }

    await admin
      .from('customized_hat_orders')
      .update({ sumup_checkout_id: checkoutId })
      .eq('group_order_id', groupOrderId);

    return NextResponse.json({
      success: true,
      checkoutId,
      groupOrderId,
      totalPaid: amount,
    });
  } catch (error: unknown) {
    console.error('Custom create checkout error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: msg || 'Failed to create checkout' },
      { status: 500 }
    );
  }
}
