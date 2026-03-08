import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/runway-events - List all runway events (admin)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: member } = await admin
      .from('members')
      .select('id, role')
      .eq('auth_id', user.id)
      .single();

    const roleStr = (member?.role ?? '').toLowerCase();
    if (!member || !roleStr.includes('admin')) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const { data: events, error } = await admin
      .from('runway_events')
      .select('id, title, subtitle, event_date, start_time, guest_list_limit, ticket_limit, ticket_price, guest_list_enabled, tickets_enabled, items_reveal_hours_after_start, hat_ids, status, created_at, updated_at')
      .order('event_date', { ascending: false });

    if (error) {
      console.error('Admin runway events list error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Get guests and tickets for each event
    const eventIds = (events || []).map((e: { id: string }) => e.id);
    const guestsByEvent: Record<string, { id: string; name: string; email: string; phone: string; created_at: string }[]> = {};
    const ticketsByEvent: Record<string, { id: string; name: string; email: string; phone: string; quantity: number; total_paid: number; payment_status: string; created_at: string }[]> = {};
    const attendeeCounts: Record<string, { guests: number; tickets: number; ticketSales: number }> = {};

    if (eventIds.length > 0) {
      const [guestRes, ticketRes] = await Promise.all([
        admin.from('runway_orders').select('id, runway_event_id, name, email, phone, created_at').in('runway_event_id', eventIds),
        admin.from('runway_tickets').select('id, runway_event_id, name, email, phone, quantity, total_paid, payment_status, created_at').eq('payment_status', 'completed').in('runway_event_id', eventIds),
      ]);

      eventIds.forEach((id) => {
        guestsByEvent[id] = [];
        ticketsByEvent[id] = [];
        attendeeCounts[id] = { guests: 0, tickets: 0, ticketSales: 0 };
      });
      (guestRes.data || []).forEach((r: any) => {
        if (r.runway_event_id && guestsByEvent[r.runway_event_id]) {
          guestsByEvent[r.runway_event_id].push({
            id: r.id,
            name: r.name || '',
            email: r.email || '',
            phone: r.phone || '',
            created_at: r.created_at,
          });
          attendeeCounts[r.runway_event_id].guests += 1;
        }
      });
      (ticketRes.data || []).forEach((r: any) => {
        if (r.runway_event_id && ticketsByEvent[r.runway_event_id]) {
          ticketsByEvent[r.runway_event_id].push({
            id: r.id,
            name: r.name || '',
            email: r.email || '',
            phone: r.phone || '',
            quantity: r.quantity || 1,
            total_paid: Number(r.total_paid) || 0,
            payment_status: r.payment_status || '',
            created_at: r.created_at,
          });
          attendeeCounts[r.runway_event_id].tickets += r.quantity || 1;
          attendeeCounts[r.runway_event_id].ticketSales += Number(r.total_paid) || 0;
        }
      });
    }

    const now = new Date();
    const list = (events || []).map((e: any) => {
      const revealHours = e.items_reveal_hours_after_start ?? 0;
      const timePart = e.start_time ? String(e.start_time).padEnd(8, ':00').slice(0, 8) : '00:00:00';
      const eventStart = new Date(`${e.event_date}T${timePart}`);
      const revealAt = new Date(eventStart.getTime() + revealHours * 60 * 60 * 1000);
      const itemsRevealed = e.status === 'past' && now >= revealAt;
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
        hatIds: e.hat_ids || [],
        status: e.status,
        createdAt: e.created_at,
        updatedAt: e.updated_at,
        attendees: attendeeCounts[e.id] || { guests: 0, tickets: 0, ticketSales: 0 },
        totalAttendees: (attendeeCounts[e.id]?.guests || 0) + (attendeeCounts[e.id]?.tickets || 0),
        guests: guestsByEvent[e.id] || [],
        tickets: ticketsByEvent[e.id] || [],
      };
    });

    return NextResponse.json({ success: true, events: list });
  } catch (error: unknown) {
    console.error('Admin runway events GET error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/runway-events - Create runway event
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: member } = await admin
      .from('members')
      .select('id, role')
      .eq('auth_id', user.id)
      .single();

    const roleStr = (member?.role ?? '').toLowerCase();
    if (!member || !roleStr.includes('admin')) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      subtitle,
      eventDate,
      startTime,
      guestListLimit,
      ticketLimit,
      ticketPrice,
      guestListEnabled,
      ticketsEnabled,
      itemsRevealHoursAfterStart,
      hatIds,
      status,
    } = body;

    if (!title || !eventDate) {
      return NextResponse.json(
        { success: false, error: 'Title and event date are required' },
        { status: 400 }
      );
    }

    const row = {
      title: String(title).trim(),
      subtitle: subtitle ? String(subtitle).trim() : null,
      event_date: eventDate,
      start_time: startTime || null,
      guest_list_limit: guestListLimit != null ? Number(guestListLimit) : null,
      ticket_limit: ticketLimit != null ? Number(ticketLimit) : null,
      ticket_price: Number(ticketPrice) || 0,
      guest_list_enabled: guestListEnabled !== false,
      tickets_enabled: ticketsEnabled === true,
      items_reveal_hours_after_start: itemsRevealHoursAfterStart != null ? Number(itemsRevealHoursAfterStart) : 0,
      hat_ids: Array.isArray(hatIds) ? hatIds : [],
      status: status || 'upcoming',
    };

    const { data: event, error } = await admin
      .from('runway_events')
      .insert(row)
      .select('id, title, event_date, status, created_at')
      .single();

    if (error) {
      console.error('Admin runway event create error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        eventDate: event.event_date,
        status: event.status,
        createdAt: event.created_at,
      },
    });
  } catch (error: unknown) {
    console.error('Admin runway event POST error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to create event' },
      { status: 500 }
    );
  }
}
