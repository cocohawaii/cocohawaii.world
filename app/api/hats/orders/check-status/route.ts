import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * GET /api/hats/orders/check-status?checkoutId=xxx
 * Polls SumUp checkout status and returns paid/failed/pending.
 * When PAID: updates order, sends confirmation + admin emails.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkoutId = searchParams.get('checkoutId');
    if (!checkoutId) {
      return NextResponse.json(
        { success: false, error: 'checkoutId required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.SUMUP_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Payment configuration missing' },
        { status: 500 }
      );
    }

    const res = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data.message || 'Checkout not found' },
        { status: res.status }
      );
    }

    const status = (data.status || '').toUpperCase();

    if (status === 'PAID') {
      const admin = createAdminClient();
      const ref = data.checkout_reference ?? data.reference;
      type OrderRow = { order_id: string; hat_wix_id?: string; customer_name: string; customer_email: string; hat_title: string; hat_subtitle?: string; hat_price: number; shipping_cost: number; total_price: number; customer_address: string; shipping_city: string; shipping_postal_code: string; shipping_country: string; shipping_option?: string };
      let orderRow: OrderRow | null = null;

      if (ref) {
        const { data: order } = await admin
          .from('hat_orders')
          .update({ payment_status: 'completed' })
          .eq('wix_id', ref)
          .eq('payment_status', 'pending')
          .select('order_id, hat_wix_id, customer_name, customer_email, hat_title, hat_subtitle, hat_price, shipping_cost, total_price, customer_address, shipping_city, shipping_postal_code, shipping_country, shipping_option')
          .single();

        if (order) orderRow = order as OrderRow;
      }

      if (!orderRow) {
        const { data: byCheckout } = await admin
          .from('hat_orders')
          .update({ payment_status: 'completed' })
          .eq('sumup_checkout_id', checkoutId)
          .eq('payment_status', 'pending')
          .select('order_id, hat_wix_id, customer_name, customer_email, hat_title, hat_subtitle, hat_price, shipping_cost, total_price, customer_address, shipping_city, shipping_postal_code, shipping_country, shipping_option')
          .single();

        if (byCheckout) orderRow = byCheckout as OrderRow;
      }

      if (orderRow?.hat_wix_id) {
        await admin.from('hats').update({ is_sold: true }).eq('wix_id', orderRow.hat_wix_id);
      }

      if (orderRow) {
        const { order_id, customer_name, customer_email, hat_title, hat_subtitle, hat_price, shipping_cost, total_price, customer_address, shipping_city, shipping_postal_code, shipping_country, shipping_option } = orderRow;
        sendOrderConfirmationEmail({
          to: customer_email,
          name: customer_name || 'Customer',
          hatTitle: hat_title || 'Your Hat',
          hatSubtitle: hat_subtitle || undefined,
          hatPrice: hat_price ?? 0,
          shippingCost: shipping_cost ?? 0,
          totalPrice: total_price ?? 0,
          orderId: order_id,
          shippingAddress: customer_address || '',
          shippingCity: shipping_city || '',
          shippingPostalCode: shipping_postal_code || '',
          shippingCountry: shipping_country || '',
          shippingOption: shipping_option || undefined,
        }).catch((e) => console.error('Order confirmation email failed:', e));

        const esc = (s: string) => (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        sendAdminOrderNotification({
          orderType: 'premade',
          customerName: esc(customer_name || 'Customer'),
          customerEmail: customer_email,
          orderId: order_id,
          itemSummary: `${esc(hat_title || 'Hat')}${hat_subtitle ? ` (${esc(hat_subtitle)})` : ''}`,
          totalPrice: total_price ?? 0,
          shippingAddress: [customer_address, shipping_city, shipping_postal_code, shipping_country].filter(Boolean).map(esc).join(', ') || '—',
        }).catch((e) => console.error('Admin notification failed:', e));
      }

      return NextResponse.json({
        success: true,
        status: 'paid',
        orderId: orderRow?.order_id || ref,
      });
    }

    return NextResponse.json({
      success: true,
      status: status === 'FAILED' ? 'failed' : status === 'EXPIRED' ? 'expired' : 'pending',
    });
  } catch (error: unknown) {
    console.error('Hat order check-status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
