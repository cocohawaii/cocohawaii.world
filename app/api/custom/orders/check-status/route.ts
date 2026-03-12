import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendCustomOrderConfirmationEmail, sendAdminOrderNotification } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * GET /api/custom/orders/check-status?checkoutId=xxx
 * Polls SumUp checkout status and returns paid/failed/pending.
 * When PAID: updates all rows for group_order_id, sends confirmation + admin emails.
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

    const data = (await res.json()) as Record<string, unknown>;

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: (data.message as string) || 'Checkout not found' },
        { status: res.status }
      );
    }

    const status = ((data.status as string) || '').toUpperCase();

    if (status === 'PAID') {
      const admin = createAdminClient();
      const ref = (data.checkout_reference ?? data.reference) as string | undefined;

      // Update all rows for this order (by sumup_checkout_id)
      const { data: updated } = await admin
        .from('customized_hat_orders')
        .update({ payment_status: 'completed', order_paid: true })
        .eq('sumup_checkout_id', checkoutId)
        .eq('payment_status', 'pending')
        .select('group_order_id, email, name, address, shipping_price, final_total_price, shipping_type');

      const first = Array.isArray(updated) ? updated[0] : (updated as Record<string, unknown> | null);
      const groupOrderId = (first?.group_order_id as string) || ref;

      if (first && groupOrderId) {
        const { data: rows } = await admin
          .from('customized_hat_orders')
          .select('hat_form, hat_color_name, art, hat_product_image')
          .eq('group_order_id', groupOrderId);

        const esc = (s: string) => (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const hatsSummary = (rows || []).map((r: { hat_form?: unknown; hat_color_name?: string; art?: string }, i: number) => {
          const form = esc(Array.isArray(r.hat_form) ? String(r.hat_form[0] || 'Custom') : String(r.hat_form || 'Custom'));
          const color = esc(r.hat_color_name || '');
          const art = r.art ? ` · ${esc(r.art)}` : '';
          return `${i + 1}. ${form}${color ? ` ${color}` : ''}${art}`;
        }).join('<br>');

        const subtotal = totalPrice - shippingCost;
        const shippingCost = Number(first.shipping_price) ?? 0;
        const totalPrice = Number(first.final_total_price) ?? 0;
        const hatCount = rows?.length ?? 1;

        sendCustomOrderConfirmationEmail({
          to: (first.email || '').toLowerCase().trim(),
          name: first.name || 'Customer',
          groupOrderId,
          hatCount,
          hatsSummary,
          subtotal: totalPrice - shippingCost,
          shippingCost,
          totalPrice,
          shippingAddress: first.address || '',
          shippingType: first.shipping_type || undefined,
        }).catch((e) => console.error('Custom order confirmation email failed:', e));

        const itemSummary = (rows || []).map((r: { hat_form?: unknown; hat_color_name?: string; art?: string }, i: number) => {
          const form = esc(Array.isArray(r.hat_form) ? String(r.hat_form[0] || 'Custom') : String(r.hat_form || 'Custom'));
          const color = esc(r.hat_color_name || '');
          const art = r.art ? ` · ${esc(r.art)}` : '';
          return `${i + 1}. ${form}${color ? ` ${color}` : ''}${art}`;
        }).join(' | ');

        sendAdminOrderNotification({
          orderType: 'custom',
          customerName: esc(first.name || 'Customer'),
          customerEmail: (first.email || '').toLowerCase().trim(),
          orderId: groupOrderId,
          itemSummary: itemSummary || `${hatCount} custom hat(s)`,
          totalPrice,
          shippingAddress: first.address || '—',
        }).catch((e) => console.error('Admin notification failed:', e));
      }

      return NextResponse.json({
        success: true,
        status: 'paid',
        groupOrderId: groupOrderId || ref,
      });
    }

    return NextResponse.json({
      success: true,
      status: status === 'FAILED' ? 'failed' : status === 'EXPIRED' ? 'expired' : 'pending',
    });
  } catch (error: unknown) {
    console.error('Custom order check-status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
