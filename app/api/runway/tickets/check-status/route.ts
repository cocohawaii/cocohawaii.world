import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/runway/tickets/check-status?checkoutId=xxx
 * Polls SumUp checkout status and updates our ticket when PAID.
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
    const debug = searchParams.get('debug') === '1';
    if (debug) {
      console.log('[SumUp check-status]', { checkoutId, status: data.status, full: JSON.stringify(data).slice(0, 500) });
    }

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data.message || 'Checkout not found', ...(debug && { _debug: data }) },
        { status: res.status }
      );
    }

    const status = (data.status || '').toUpperCase();

    if (status === 'PAID') {
      const admin = createAdminClient();
      const ref = data.checkout_reference ?? data.reference;
      let updated = false;

      if (ref) {
        const { data: ticket } = await admin
          .from('runway_tickets')
          .update({ payment_status: 'completed' })
          .eq('id', ref)
          .eq('payment_status', 'pending')
          .select('id')
          .single();

        if (ticket) {
          updated = true;
          return NextResponse.json({ success: true, status: 'paid', ticketId: ticket.id });
        }
      }

      if (!updated) {
        const { data: byCheckout } = await admin
          .from('runway_tickets')
          .update({ payment_status: 'completed' })
          .eq('sumup_checkout_id', checkoutId)
          .eq('payment_status', 'pending')
          .select('id')
          .single();

        if (byCheckout) {
          return NextResponse.json({ success: true, status: 'paid', ticketId: byCheckout.id });
        }
      }
    }

    return NextResponse.json({
      success: true,
      status: status === 'FAILED' ? 'failed' : status === 'EXPIRED' ? 'expired' : 'pending',
      ...(debug && { _debug: { sumupStatus: status, raw: data } }),
    });
  } catch (error: unknown) {
    console.error('Check status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
