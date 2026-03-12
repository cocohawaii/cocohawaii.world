import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendRunwayConfirmationEmail, sendOrderConfirmationEmail, sendAdminOrderNotification, sendCustomOrderConfirmationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/sumup
 * SumUp webhook for checkout status changes.
 * Payload: { event_type: "CHECKOUT_STATUS_CHANGED", id: "checkout-id" }
 * Must verify status via SumUp API per docs.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const eventType = body.event_type || body.eventType;
    const checkoutId = body.id ?? body.payload?.checkout_id ?? body.payload?.checkoutId;

    if (
      (eventType !== 'checkout.status.updated' && eventType !== 'CHECKOUT_STATUS_CHANGED') ||
      !checkoutId
    ) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Verify event via SumUp API (required per docs)
    const apiKey = process.env.SUMUP_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const res = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const checkout = await res.json();
    const status = (checkout.status || '').toUpperCase();

    if (status !== 'PAID') {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const admin = createAdminClient();
    const reference = checkout.checkout_reference ?? checkout.reference;
    let ticketData: { id: string; email: string; name: string | null; quantity: number; total_paid: number; runway_event_id: string } | null = null;

    if (reference) {
      const { data: ticket } = await admin
        .from('runway_tickets')
        .update({ payment_status: 'completed' })
        .eq('id', reference)
        .eq('payment_status', 'pending')
        .select('id, email, name, quantity, total_paid, runway_event_id')
        .single();

      if (ticket) ticketData = ticket;
    }

    if (!ticketData && checkoutId) {
      const { data: ticket } = await admin
        .from('runway_tickets')
        .update({ payment_status: 'completed' })
        .eq('sumup_checkout_id', checkoutId)
        .eq('payment_status', 'pending')
        .select('id, email, name, quantity, total_paid, runway_event_id')
        .single();

      if (ticket) ticketData = ticket;
    }

    if (ticketData) {
      const { data: ev } = await admin
        .from('runway_events')
        .select('title, subtitle, event_date, start_time')
        .eq('id', ticketData.runway_event_id)
        .single();

      sendRunwayConfirmationEmail({
        to: ticketData.email,
        name: (ticketData.name || '').trim() || 'Guest',
        type: 'ticket',
        eventTitle: ev?.title || 'Runway Event',
        eventSubtitle: ev?.subtitle,
        eventDate: ev?.event_date,
        eventTime: ev?.start_time ? String(ev.start_time).slice(0, 5) : undefined,
        quantity: ticketData.quantity,
        totalPaid: Number(ticketData.total_paid),
      }).catch((err) => console.error('Runway confirmation email error:', err));
    } else if (!ticketData) {
      type HatOrderRow = { order_id: string; hat_wix_id?: string; customer_name: string; customer_email: string; hat_title: string; hat_subtitle?: string; hat_price: number; shipping_cost: number; total_price: number; customer_address: string; shipping_city: string; shipping_postal_code: string; shipping_country: string; shipping_option?: string };
      let hatOrder: HatOrderRow | null = null;

      if (reference) {
        const { data: byRef } = await admin
          .from('hat_orders')
          .update({ payment_status: 'completed' })
          .eq('wix_id', reference)
          .eq('payment_status', 'pending')
          .select('order_id, hat_wix_id, customer_name, customer_email, hat_title, hat_subtitle, hat_price, shipping_cost, total_price, customer_address, shipping_city, shipping_postal_code, shipping_country, shipping_option')
          .single();
        if (byRef) hatOrder = byRef as HatOrderRow;
      }

      if (!hatOrder) {
        const { data: byCheckout } = await admin
          .from('hat_orders')
          .update({ payment_status: 'completed' })
          .eq('sumup_checkout_id', checkoutId)
          .eq('payment_status', 'pending')
          .select('order_id, hat_wix_id, customer_name, customer_email, hat_title, hat_subtitle, hat_price, shipping_cost, total_price, customer_address, shipping_city, shipping_postal_code, shipping_country, shipping_option')
          .single();
        if (byCheckout) hatOrder = byCheckout as HatOrderRow;
      }

      if (hatOrder?.hat_wix_id) {
        await admin.from('hats').update({ is_sold: true }).eq('wix_id', hatOrder.hat_wix_id);
      }

      if (hatOrder) {
        const o = hatOrder;
        sendOrderConfirmationEmail({
          to: o.customer_email,
          name: o.customer_name || 'Customer',
          hatTitle: o.hat_title || 'Your Hat',
          hatSubtitle: o.hat_subtitle || undefined,
          hatPrice: o.hat_price ?? 0,
          shippingCost: o.shipping_cost ?? 0,
          totalPrice: o.total_price ?? 0,
          orderId: o.order_id,
          shippingAddress: o.customer_address || '',
          shippingCity: o.shipping_city || '',
          shippingPostalCode: o.shipping_postal_code || '',
          shippingCountry: o.shipping_country || '',
          shippingOption: o.shipping_option || undefined,
        }).catch((e) => console.error('Hat order confirmation email failed:', e));

        const esc = (s: string) => (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        sendAdminOrderNotification({
          orderType: 'premade',
          customerName: esc(o.customer_name || 'Customer'),
          customerEmail: o.customer_email,
          orderId: o.order_id,
          itemSummary: `${esc(o.hat_title || 'Hat')}${o.hat_subtitle ? ` (${esc(o.hat_subtitle)})` : ''}`,
          totalPrice: o.total_price ?? 0,
          shippingAddress: [o.customer_address, o.shipping_city, o.shipping_postal_code, o.shipping_country].filter(Boolean).map(esc).join(', ') || '—',
        }).catch((e) => console.error('Admin hat order notification failed:', e));
      } else {
        // Custom hat orders (by sumup_checkout_id)
        const { data: customRows } = await admin
          .from('customized_hat_orders')
          .update({ payment_status: 'completed', order_paid: true })
          .eq('sumup_checkout_id', checkoutId)
          .eq('payment_status', 'pending')
          .select('group_order_id, email, name, address, shipping_price, final_total_price, shipping_type, hat_form, hat_color_name, art');

        const first = Array.isArray(customRows) ? customRows[0] : customRows;
        if (first && first.group_order_id) {
          const rows = customRows || [];
          const esc = (s: string) => (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          const hatsSummary = rows.map((r: { hat_form?: unknown; hat_color_name?: string; art?: string }, i: number) => {
            const form = esc(Array.isArray(r.hat_form) ? String(r.hat_form[0] || 'Custom') : String(r.hat_form || 'Custom'));
            const color = esc(r.hat_color_name || '');
            const art = r.art ? ` · ${esc(r.art)}` : '';
            return `${i + 1}. ${form}${color ? ` ${color}` : ''}${art}`;
          }).join('<br>');
          const shippingCost = Number(first.shipping_price) ?? 0;
          const totalPrice = Number(first.final_total_price) ?? 0;
          const hatCount = rows.length;

          sendCustomOrderConfirmationEmail({
            to: (first.email || '').toLowerCase().trim(),
            name: first.name || 'Customer',
            groupOrderId: first.group_order_id,
            hatCount,
            hatsSummary,
            subtotal: totalPrice - shippingCost,
            shippingCost,
            totalPrice,
            shippingAddress: first.address || '',
            shippingType: first.shipping_type || undefined,
          }).catch((e) => console.error('Custom order confirmation email failed:', e));

          const itemSummary = rows.map((r: { hat_form?: unknown; hat_color_name?: string; art?: string }, i: number) => {
            const form = esc(Array.isArray(r.hat_form) ? String(r.hat_form[0] || 'Custom') : String(r.hat_form || 'Custom'));
            const color = esc(r.hat_color_name || '');
            const art = r.art ? ` · ${esc(r.art)}` : '';
            return `${i + 1}. ${form}${color ? ` ${color}` : ''}${art}`;
          }).join(' | ');

          sendAdminOrderNotification({
            orderType: 'custom',
            customerName: esc(first.name || 'Customer'),
            customerEmail: (first.email || '').toLowerCase().trim(),
            orderId: first.group_order_id,
            itemSummary: itemSummary || `${hatCount} custom hat(s)`,
            totalPrice,
            shippingAddress: first.address || '—',
          }).catch((e) => console.error('Admin custom order notification failed:', e));
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: unknown) {
    console.error('SumUp webhook error:', error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
