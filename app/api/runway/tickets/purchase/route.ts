import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendRunwayConfirmationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * POST /api/runway/tickets/purchase
 * Purchase runway tickets - payment via SumUp (same pattern as star bid packs).
 * When user is logged in, auto-links ticket to their account (member_id).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      runway_event_id,
      quantity = 1,
      name,
      email,
      phone,
      member_id: bodyMemberId,
      payment_method = 'Card (SumUp)',
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

    // If user is logged in, link ticket to their account (so it shows in My Runway Events)
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
      // Ignore auth errors - guest purchase is fine
    }

    // Validate event
    const { data: ev, error: evErr } = await admin
      .from('runway_events')
      .select('id, title, subtitle, event_date, start_time, tickets_enabled, ticket_limit, ticket_price')
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

    // Check capacity (sum of quantity sold)
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

    // Insert ticket record (payment via SumUp - same trust model as star bid packs)
    const { data: ticket, error } = await admin
      .from('runway_tickets')
      .insert({
        runway_event_id,
        member_id: memberIdToUse,
        email: emailLower,
        name: (name || '').trim() || null,
        phone: (phone || '').trim() || null,
        quantity: qty,
        total_paid: totalPaid,
        payment_status: 'completed',
      })
      .select('id, runway_event_id, email, quantity, total_paid')
      .single();

    if (error) {
      console.error('Runway ticket purchase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to complete purchase. Please try again.' },
        { status: 500 }
      );
    }

    sendRunwayConfirmationEmail({
      to: emailLower,
      name: (name || '').trim() || 'Guest',
      type: 'ticket',
      eventTitle: ev.title || 'Runway Event',
      eventSubtitle: ev.subtitle || undefined,
      eventDate: ev.event_date,
      eventTime: ev.start_time ? String(ev.start_time).slice(0, 5) : undefined,
      quantity: qty,
      totalPaid: totalPaid,
    }).catch((err) => console.error('Runway confirmation email error:', err));

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket!.id,
        eventId: ticket!.runway_event_id,
        email: ticket!.email,
        quantity: ticket!.quantity,
        totalPaid: Number(ticket!.total_paid),
        paymentMethod: payment_method,
      },
    });
  } catch (error: unknown) {
    console.error('Runway ticket purchase error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete purchase',
      },
      { status: 500 }
    );
  }
}
