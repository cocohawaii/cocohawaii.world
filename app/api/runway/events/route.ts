import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/runway/events - List runway events (public)
 * Returns upcoming and past events for signup page and display.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'upcoming' | 'past' | all

    let query = admin
      .from('runway_events')
      .select('id, title, subtitle, event_date, start_time, guest_list_limit, ticket_limit, ticket_price, guest_list_enabled, tickets_enabled, items_reveal_hours_after_start, hat_ids, status, created_at')
      .in('status', ['upcoming', 'past']);

    if (status === 'upcoming') {
      query = query.eq('status', 'upcoming');
    } else if (status === 'past') {
      query = query.eq('status', 'past');
    }

    const { data: events, error } = await query.order('event_date', { ascending: true });

    if (error) {
      console.error('Runway events list error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Get attendee counts for each event
    const eventIds = (events || []).map((e: { id: string }) => e.id);
    const attendeeCounts: Record<string, { guests: number; tickets: number }> = {};

    if (eventIds.length > 0) {
      const [guestRes, ticketRes] = await Promise.all([
        admin.from('runway_orders').select('runway_event_id').in('runway_event_id', eventIds),
        admin.from('runway_tickets').select('runway_event_id, quantity').eq('payment_status', 'completed').in('runway_event_id', eventIds),
      ]);

      eventIds.forEach((id) => {
        attendeeCounts[id] = { guests: 0, tickets: 0 };
      });
      (guestRes.data || []).forEach((r: { runway_event_id: string }) => {
        if (r.runway_event_id && attendeeCounts[r.runway_event_id]) {
          attendeeCounts[r.runway_event_id].guests += 1;
        }
      });
      (ticketRes.data || []).forEach((r: { runway_event_id: string; quantity: number }) => {
        if (r.runway_event_id && attendeeCounts[r.runway_event_id]) {
          attendeeCounts[r.runway_event_id].tickets += r.quantity || 1;
        }
      });
    }

    const now = new Date();

    const list = (events || []).map((e: any) => {
      const revealHours = e.items_reveal_hours_after_start ?? 0;
      const rawHatIds = e.hat_ids || [];

      // Compute event start: event_date + start_time (default midnight)
      const timePart = e.start_time ? String(e.start_time).padEnd(8, ':00').slice(0, 8) : '00:00:00';
      const eventStart = new Date(`${e.event_date}T${timePart}`);

      const revealAt = new Date(eventStart.getTime() + revealHours * 60 * 60 * 1000);
      const itemsRevealed = e.status === 'past' && now >= revealAt;
      const hatIds = itemsRevealed ? rawHatIds : [];
      const itemsCount = rawHatIds.length;

      return {
        id: e.id,
        title: e.title,
        subtitle: e.subtitle,
        eventDate: e.event_date,
        startTime: e.start_time,
        guestListLimit: e.guest_list_limit,
        ticketLimit: e.ticket_limit,
        ticketPrice: Number(e.ticket_price) || 0,
        guestListEnabled: e.guest_list_enabled,
        ticketsEnabled: e.tickets_enabled,
        itemsRevealHoursAfterStart: revealHours,
        itemsRevealed,
        itemsRevealAt: revealAt.toISOString(),
        hatIds,
        itemsCount,
        status: e.status,
        createdAt: e.created_at,
        attendees: attendeeCounts[e.id] || { guests: 0, tickets: 0 },
        totalAttendees: (attendeeCounts[e.id]?.guests || 0) + (attendeeCounts[e.id]?.tickets || 0),
      };
    });

    return NextResponse.json({ success: true, events: list });
  } catch (error: unknown) {
    console.error('Runway events GET error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
