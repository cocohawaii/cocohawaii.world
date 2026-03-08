import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from '@/lib/email';
import { randomUUID } from 'crypto';

export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'create') {
      const admin = createAdminClient();

      let orderId = 'CHhatOrder1';
      const { data: existing } = await admin.from('hat_orders').select('order_id').limit(1000);
      if (existing && existing.length > 0) {
        let maxNum = 0;
        existing.forEach((o: any) => {
          const m = (o.order_id || '').match(/CHhatOrder(\d+)/);
          if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
        });
        if (maxNum > 0) orderId = `CHhatOrder${maxNum + 1}`;
      }

      const prReferralId = data.prReferralId || '';

      const normalizedEmail = (data.hatorderEmail || '').toLowerCase().trim();
      const row = {
        wix_id: randomUUID(),
        order_id: orderId,
        customer_name: data.hatorderName || '',
        customer_email: normalizedEmail,
        customer_mobile: data.hatorderMobile || '',
        customer_address: data.orderAddress || '',
        shipping_city: data.shippingCity || '',
        shipping_postal_code: data.shippingPostalCode || '',
        shipping_country: data.shippingCountry || '',
        hat_title: data.hatOrdertitle || '',
        hat_subtitle: data.hatOrderSubtitle || '',
        hat_price: Number(data.hatOrderPrice) || 0,
        shipping_cost: Number(data.shippingCost) || 0,
        total_price: Number(data.totalFinalCost) || Number(data.hatOrderPrice) || 0,
        shipping_option: data.shippingOption || '',
        custom_ask: data.hatorderCustomAsk || '',
        pr_referral_id: prReferralId || null,
        order_created_on: new Date().toISOString(),
      };

      const { data: inserted, error } = await admin.from('hat_orders').insert(row).select('wix_id').single();
      if (error) {
        console.error('Order create error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      // Send order confirmation email (fire-and-forget, don't block response)
      sendOrderConfirmationEmail({
        to: normalizedEmail,
        name: data.hatorderName || 'Customer',
        hatTitle: data.hatOrdertitle || 'Your Hat',
        hatSubtitle: data.hatOrderSubtitle || undefined,
        hatPrice: Number(data.hatOrderPrice) || 0,
        shippingCost: Number(data.shippingCost) || 0,
        totalPrice: Number(data.totalFinalCost) || Number(data.hatOrderPrice) || 0,
        orderId: orderId,
        shippingAddress: data.orderAddress || '',
        shippingCity: data.shippingCity || '',
        shippingPostalCode: data.shippingPostalCode || '',
        shippingCountry: data.shippingCountry || '',
        shippingOption: data.shippingOption || undefined,
      }).catch((e) => console.error('Order confirmation email failed:', e));

      const esc = (s: string) => (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      sendAdminOrderNotification({
        orderType: 'premade',
        customerName: esc(data.hatorderName || 'Customer'),
        customerEmail: normalizedEmail,
        orderId: orderId,
        itemSummary: `${esc(data.hatOrdertitle || 'Hat')}${data.hatOrderSubtitle ? ` (${esc(data.hatOrderSubtitle)})` : ''}`,
        totalPrice: Number(data.totalFinalCost) || Number(data.hatOrderPrice) || 0,
        shippingAddress: [data.orderAddress, data.shippingCity, data.shippingPostalCode, data.shippingCountry].filter(Boolean).map(esc).join(', ') || '—',
      }).catch((e) => console.error('Admin notification failed:', e));

      return NextResponse.json({ success: true, orderId: inserted.wix_id, hatOrderID: orderId });
    }

    if (action === 'update') {
      const { orderId, ...updates } = data;
      const admin = createAdminClient();
      const updateRow: Record<string, any> = {};
      const map: Record<string, string> = {
        hatorderName: 'customer_name',
        hatorderEmail: 'customer_email',
        hatorderMobile: 'customer_mobile',
        orderAddress: 'customer_address',
        shippingCity: 'shipping_city',
        shippingPostalCode: 'shipping_postal_code',
        shippingCountry: 'shipping_country',
        hatOrdertitle: 'hat_title',
        hatOrderSubtitle: 'hat_subtitle',
        hatOrderPrice: 'hat_price',
        shippingCost: 'shipping_cost',
        totalFinalCost: 'total_price',
        shippingOption: 'shipping_option',
        hatorderCustomAsk: 'custom_ask',
      };
      Object.keys(updates).forEach((k) => {
        if (map[k]) updateRow[map[k]] = updates[k];
      });
      const { error } = await admin.from('hat_orders').update(updateRow).eq('wix_id', orderId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (action === 'getNextId') {
      const admin = createAdminClient();
      let orderId = 'CHhatOrder1';
      const { data: orders } = await admin.from('hat_orders').select('order_id').limit(1000);
      if (orders && orders.length > 0) {
        let maxNum = 0;
        orders.forEach((o: any) => {
          const m = (o.order_id || '').match(/CHhatOrder(\d+)/);
          if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
        });
        if (maxNum > 0) orderId = `CHhatOrder${maxNum + 1}`;
      }
      return NextResponse.json({ success: true, orderId });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Order API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process order' },
      { status: 500 }
    );
  }
}
