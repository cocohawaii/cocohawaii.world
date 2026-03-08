import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendRunwayConfirmationEmail } from '@/lib/email';

export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, eventDate, runway_event_id } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const emailLower = email.toLowerCase().trim();

    // Prefer runway_event_id; fall back to eventDate for legacy
    if (runway_event_id) {
      // Validate event exists and guest list is enabled
      const { data: ev, error: evErr } = await admin
        .from('runway_events')
        .select('id, title, subtitle, event_date, start_time, guest_list_enabled, guest_list_limit')
        .eq('id', runway_event_id)
        .eq('status', 'upcoming')
        .single();

      if (evErr || !ev) {
        return NextResponse.json(
          { error: 'Invalid or unavailable event' },
          { status: 400 }
        );
      }
      if (!ev.guest_list_enabled) {
        return NextResponse.json(
          { error: 'Guest list signup is not available for this event' },
          { status: 400 }
        );
      }

      // Check capacity
      const { count } = await admin
        .from('runway_orders')
        .select('*', { count: 'exact', head: true })
        .eq('runway_event_id', runway_event_id);

      const limit = ev.guest_list_limit ?? 0;
      if (limit > 0 && (count ?? 0) >= limit) {
        return NextResponse.json(
          { error: 'This event is full' },
          { status: 409 }
        );
      }

      // Check duplicate
      const { data: existing } = await admin
        .from('runway_orders')
        .select('id')
        .eq('email', emailLower)
        .eq('runway_event_id', runway_event_id)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'You are already on the guest list for this event' },
          { status: 409 }
        );
      }

      const { data: newGuest, error } = await admin
        .from('runway_orders')
        .insert({
          name: name.trim(),
          email: emailLower,
          phone: phone.trim(),
          runway_event_id: runway_event_id,
          event_date: ev.event_date,
        })
        .select('id, name, email, phone, event_date')
        .single();

      if (error) {
        if (error.code === '23505') {
          return NextResponse.json(
            { error: 'You are already on the guest list for this event' },
            { status: 409 }
          );
        }
        console.error('Runway signup error:', error);
        return NextResponse.json(
          { error: 'Failed to join guest list. Please try again.' },
          { status: 500 }
        );
      }

      sendRunwayConfirmationEmail({
        to: emailLower,
        name: name.trim(),
        type: 'guest',
        eventTitle: ev.title || 'Runway Event',
        eventSubtitle: ev.subtitle || undefined,
        eventDate: ev.event_date,
        eventTime: ev.start_time ? String(ev.start_time).slice(0, 5) : undefined,
      }).catch((err) => console.error('Runway confirmation email error:', err));

      return NextResponse.json({
        success: true,
        guest: {
          name: newGuest!.name,
          email: newGuest!.email,
          phone: newGuest!.phone,
          eventDate: newGuest!.event_date,
        },
      });
    }

    // Legacy: eventDate only
    if (!eventDate) {
      return NextResponse.json(
        { error: 'Please select an event' },
        { status: 400 }
      );
    }

    const { data: existing } = await admin
      .from('runway_orders')
      .select('id')
      .eq('email', emailLower)
      .eq('event_date', String(eventDate))
      .is('runway_event_id', null)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'You are already on the guest list for this event' },
        { status: 409 }
      );
    }

    const { data: newGuest, error } = await admin
      .from('runway_orders')
      .insert({
        name: name.trim(),
        email: emailLower,
        phone: phone.trim(),
        event_date: String(eventDate),
      })
      .select('id, name, email, phone, event_date')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'You are already on the guest list for this event' },
          { status: 409 }
        );
      }
      console.error('Runway signup error:', error);
      return NextResponse.json(
        { error: 'Failed to join guest list. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      guest: {
        name: newGuest.name,
        email: newGuest.email,
        phone: newGuest.phone,
        eventDate: newGuest.event_date,
      },
    });
  } catch (error: unknown) {
    console.error('Runway signup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to join guest list' },
      { status: 500 }
    );
  }
}
