import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/runway/tickets/create-checkout
 * Creates a pending runway ticket and a SumUp checkout for the card widget.
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
    const {
      runway_event_id,
      quantity = 1,
      name,
      email,
      phone,
      member_id: bodyMemberId,
    } = body;

    if (!runway_event_id) {
      return NextResponse.json(
        { success: false, error: 'Event is required' },
        { status: 400 }
      );
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const qty = Math.max(1, Math.min(50, Math.floor(Number(quantity)) || 1));
    const admin = createAdminClient();
    const emailLower = email.toLowerCase().trim();

    let memberIdToUse = bodyMemberId || null;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: member } = await admin
          .from('members')
          .select('id')
          .eq('auth_id', user.id)
          .single();
        if (member) memberIdToUse = member.id;
      }
    } catch {
      // Ignore
    }

    const { data: ev, error: evErr } = await admin
      .from('runway_events')
      .select('id, title, ticket_limit, ticket_price, tickets_enabled')
      .eq('id', runway_event_id)
      .eq('status', 'upcoming')
      .single();

    if (evErr || !ev) {
      return NextResponse.json(
        { success: false, error: 'Invalid or unavailable event' },
        { status: 400 }
      );
    }

    if (!ev.tickets_enabled) {
      return NextResponse.json(
        { success: false, error: 'Tickets are not available for this event' },
        { status: 400 }
      );
    }

    const ticketPrice = Number(ev.ticket_price) || 0;
    const totalPaid = ticketPrice * qty;

    const { data: soldRows } = await admin
      .from('runway_tickets')
      .select('quantity')
      .eq('runway_event_id', runway_event_id)
      .eq('payment_status', 'completed');

    const ticketsSold = (soldRows || []).reduce((sum, r) => sum + (r.quantity || 1), 0);
    const limit = ev.ticket_limit ?? 0;
    const available = limit > 0 ? Math.max(0, limit - ticketsSold) : 999;
    if (qty > available) {
      return NextResponse.json(
        { success: false, error: `Only ${available} ticket(s) remaining` },
        { status: 409 }
      );
    }

    // Insert pending ticket first
    const { data: ticket, error: ticketErr } = await admin
      .from('runway_tickets')
      .insert({
        runway_event_id,
        member_id: memberIdToUse,
        email: emailLower,
        name: (name || '').trim() || null,
        phone: (phone || '').trim() || null,
        quantity: qty,
        total_paid: totalPaid,
        payment_status: 'pending',
      })
      .select('id')
      .single();

    if (ticketErr || !ticket) {
      console.error('Runway ticket insert error:', ticketErr);
      const msg = ticketErr?.message || (ticketErr as { details?: string })?.details;
      return NextResponse.json(
        { success: false, error: msg || 'Failed to create ticket. Please try again.' },
        { status: 500 }
      );
    }

    // Base URL for redirects (SumUp redirects user here after payment/3DS)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cocohawaii.world';
    const paymentReturnUrl = `${baseUrl.replace(/\/$/, '')}/runway-guest-list?payment_return=1`;

    // Create SumUp checkout (amount in main currency unit, e.g. EUR)
    const sumupRes = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        merchant_code: merchantCode,
        amount: totalPaid,
        currency: 'EUR',
        checkout_reference: ticket.id,
        description: `Runway ticket${qty > 1 ? 's' : ''} - ${ev.title || 'Event'}`,
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
      await admin.from('runway_tickets').delete().eq('id', ticket.id);
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
      await admin.from('runway_tickets').delete().eq('id', ticket.id);
      return NextResponse.json(
        { success: false, error: 'Invalid payment response' },
        { status: 500 }
      );
    }

    // Store SumUp checkout ID on ticket (optional, for webhook lookup)
    try {
      await admin
        .from('runway_tickets')
        .update({ sumup_checkout_id: checkoutId })
        .eq('id', ticket.id);
    } catch {
      // Column may not exist yet; checkout_reference is sufficient for webhook
    }

    return NextResponse.json({
      success: true,
      checkoutId,
      ticketId: ticket.id,
      totalPaid,
    });
  } catch (error: unknown) {
    console.error('Create checkout error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: msg || 'Failed to create checkout',
      },
      { status: 500 }
    );
  }
}
