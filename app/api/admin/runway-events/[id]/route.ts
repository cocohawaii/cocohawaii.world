import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/admin/runway-events/[id] - Get single event with signups
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ success: false, error: 'Invalid event ID' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: member } = await admin.from('members').select('role').eq('auth_id', user.id).single();
    const roleStr = (member?.role ?? '').toLowerCase();
    if (!member || !roleStr.includes('admin')) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const { data: event, error: eventError } = await admin
      .from('runway_events')
      .select('*')
      .eq('id', id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    const [guestsRes, ticketsRes] = await Promise.all([
      admin.from('runway_orders').select('id, name, email, phone, created_at').eq('runway_event_id', id),
      admin.from('runway_tickets').select('id, name, email, phone, quantity, total_paid, payment_status, created_at').eq('runway_event_id', id),
    ]);

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        subtitle: event.subtitle,
        eventDate: event.event_date,
        startTime: event.start_time,
        guestListLimit: event.guest_list_limit,
        ticketLimit: event.ticket_limit,
        ticketPrice: Number(event.ticket_price) || 0,
        guestListEnabled: event.guest_list_enabled,
        ticketsEnabled: event.tickets_enabled,
        itemsRevealHoursAfterStart: event.items_reveal_hours_after_start ?? 0,
        hatIds: event.hat_ids || [],
        status: event.status,
        createdAt: event.created_at,
      },
      guests: guestsRes.data || [],
      tickets: ticketsRes.data || [],
    });
  } catch (error: unknown) {
    console.error('Admin runway event GET error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/runway-events/[id] - Update event
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ success: false, error: 'Invalid event ID' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: member } = await admin.from('members').select('role').eq('auth_id', user.id).single();
    const roleStr = (member?.role ?? '').toLowerCase();
    if (!member || !roleStr.includes('admin')) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.title != null) updates.title = String(body.title).trim();
    if (body.subtitle != null) updates.subtitle = body.subtitle ? String(body.subtitle).trim() : null;
    if (body.eventDate != null) updates.event_date = body.eventDate;
    if (body.startTime != null) updates.start_time = body.startTime;
    if (body.guestListLimit != null) updates.guest_list_limit = body.guestListLimit;
    if (body.ticketLimit != null) updates.ticket_limit = body.ticketLimit;
    if (body.ticketPrice != null) updates.ticket_price = Number(body.ticketPrice);
    if (body.guestListEnabled != null) updates.guest_list_enabled = body.guestListEnabled;
    if (body.ticketsEnabled != null) updates.tickets_enabled = body.ticketsEnabled;
    if (body.itemsRevealHoursAfterStart != null) updates.items_reveal_hours_after_start = Number(body.itemsRevealHoursAfterStart);
    if (body.hatIds != null) updates.hat_ids = Array.isArray(body.hatIds) ? body.hatIds : [];
    if (body.status != null && ['draft', 'upcoming', 'past'].includes(body.status)) updates.status = body.status;

    const { error } = await admin
      .from('runway_events')
      .update(updates)
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Admin runway event PATCH error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to update' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/runway-events/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ success: false, error: 'Invalid event ID' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: member } = await admin.from('members').select('role').eq('auth_id', user.id).single();
    const roleStr = (member?.role ?? '').toLowerCase();
    if (!member || !roleStr.includes('admin')) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const { error } = await admin.from('runway_events').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Admin runway event DELETE error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to delete' },
      { status: 500 }
    );
  }
}
