import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/runway/my-events - List runway events the current user has signed up for
 * (guest list or tickets). Requires auth.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Please log in to view your events.' },
        { status: 401 }
      );
    }

    const admin = createAdminClient();

    // Get member by auth
    const { data: member, error: memberError } = await admin
      .from('members')
      .select('id, email')
      .eq('auth_id', user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { success: false, error: 'Member not found.' },
        { status: 404 }
      );
    }

    const emailLower = (member.email || '').toLowerCase().trim();
    const userEmailLower = (user.email || '').toLowerCase().trim();
    const emailsToMatch = [emailLower, userEmailLower].filter(Boolean);
    const uniqueEmails = [...new Set(emailsToMatch)];

    // Guest list signups (runway_orders with runway_event_id)
    const { data: guestOrders } = await admin
      .from('runway_orders')
      .select('id, runway_event_id, event_date, created_at')
      .eq('email', emailLower)
      .not('runway_event_id', 'is', null);

    // Ticket purchases (runway_tickets) - by member_id or email (try multiple email variants)
    let ticketPurchases: { id: string; runway_event_id: string; quantity: number; total_paid: number }[] = [];
    const { data: byMemberData } = await admin
      .from('runway_tickets')
      .select('id, runway_event_id, quantity, total_paid, payment_status, created_at')
      .eq('payment_status', 'completed')
      .eq('member_id', member.id);
    const { data: byEmailData } = uniqueEmails.length > 0
      ? await admin
          .from('runway_tickets')
          .select('id, runway_event_id, quantity, total_paid, payment_status, created_at')
          .eq('payment_status', 'completed')
          .in('email', uniqueEmails)
      : { data: [] as { id: string; runway_event_id: string; quantity: number; total_paid: number }[] };
    const seen = new Set<string>();
    [...(byMemberData || []), ...(byEmailData || [])].forEach((t: { id: string }) => {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        ticketPurchases.push(t);
      }
    });

    const eventIds = new Set<string>();
    (guestOrders || []).forEach((o: { runway_event_id: string }) => o.runway_event_id && eventIds.add(o.runway_event_id));
    (ticketPurchases || []).forEach((t: { runway_event_id: string }) => t.runway_event_id && eventIds.add(t.runway_event_id));

    if (eventIds.size === 0) {
      return NextResponse.json({
        success: true,
        events: [],
      });
    }

    const { data: events } = await admin
      .from('runway_events')
      .select('id, title, subtitle, event_date, start_time, status, hat_ids, items_reveal_hours_after_start')
      .in('id', Array.from(eventIds));

    const now = new Date();
    const combined = (events || []).map((e: any) => {
      const guestOrder = (guestOrders || []).find((o: { runway_event_id: string }) => o.runway_event_id === e.id);
      const ticketsForEvent = (ticketPurchases || []).filter((t: { runway_event_id: string }) => t.runway_event_id === e.id);
      const ticketQuantity = ticketsForEvent.reduce((sum, t) => sum + (t.quantity || 1), 0);
      const ticketTotalPaid = ticketsForEvent.reduce((sum, t) => sum + Number(t.total_paid || 0), 0);
      const revealHours = e.items_reveal_hours_after_start ?? 0;
      const timePart = e.start_time ? String(e.start_time).padEnd(8, ':00').slice(0, 8) : '00:00:00';
      const eventStart = new Date(`${e.event_date}T${timePart}`);
      const revealAt = new Date(eventStart.getTime() + revealHours * 60 * 60 * 1000);
      const itemsRevealed = e.status === 'past' && now >= revealAt;
      const rawHatIds = e.hat_ids || [];
      const hatIds = itemsRevealed ? rawHatIds : [];
      const itemsCount = rawHatIds.length;
      return {
        id: e.id,
        title: e.title,
        subtitle: e.subtitle,
        eventDate: e.event_date,
        startTime: e.start_time,
        status: e.status,
        type: guestOrder ? (ticketsForEvent.length ? 'guest_and_ticket' : 'guest') : 'ticket',
        guestSignupId: guestOrder?.id,
        ticketQuantity,
        ticketTotalPaid,
        itemsRevealed,
        hatIds,
        itemsCount,
      };
    });

    // Sort by event date ascending
    combined.sort((a, b) => (a.eventDate > b.eventDate ? 1 : -1));

    return NextResponse.json({
      success: true,
      events: combined,
    });
  } catch (error: unknown) {
    console.error('Runway my-events error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
