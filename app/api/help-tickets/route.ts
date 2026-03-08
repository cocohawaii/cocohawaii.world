import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/help-tickets - Create a new help ticket
 * Body: { subject, message, email?, name? }
 * - If logged in: uses member's email, creates ticket linked to member
 * - If anonymous: requires email, name optional (uses admin client)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const subject = String(body.subject || '').trim();
    const message = String(body.message || '').trim();
    const email = String(body.email || '').toLowerCase().trim();
    const name = String(body.name || '').trim();

    if (!subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Subject and message are required.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const admin = createAdminClient();

    let memberId: string | null = null;
    let ticketEmail: string;
    let ticketName: string;

    if (user) {
      const { data: member } = await admin
        .from('members')
        .select('id, email, full_name')
        .eq('auth_id', user.id)
        .single();
      if (!member) {
        return NextResponse.json(
          { success: false, error: 'Member not found. Please sign up first.' },
          { status: 404 }
        );
      }
      memberId = member.id;
      ticketEmail = member.email;
      ticketName = name || member.full_name || '';
    } else {
      if (!email) {
        return NextResponse.json(
          { success: false, error: 'Email is required when not logged in.' },
          { status: 400 }
        );
      }
      ticketEmail = email;
      ticketName = name;
    }

    const { data: ticket, error: ticketError } = await admin
      .from('help_tickets')
      .insert({
        member_id: memberId,
        email: ticketEmail,
        name: ticketName || null,
        subject,
        status: 'open',
        unread_by_admin: true,
        unread_by_user: false,
      })
      .select('id, subject, status, created_at')
      .single();

    if (ticketError) {
      console.error('Help ticket create error:', ticketError);
      return NextResponse.json(
        { success: false, error: ticketError.message },
        { status: 500 }
      );
    }

    const { error: msgError } = await admin.from('help_ticket_messages').insert({
      ticket_id: ticket.id,
      sender_type: 'user',
      sender_member_id: memberId,
      body: message,
    });

    if (msgError) {
      console.error('Help ticket message create error:', msgError);
      return NextResponse.json(
        { success: false, error: msgError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        createdAt: ticket.created_at,
      },
    });
  } catch (error: unknown) {
    console.error('Help ticket POST error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to create ticket' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/help-tickets - List tickets for the current user
 * Requires authentication.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Please log in to view your tickets.' },
        { status: 401 }
      );
    }

    const admin = createAdminClient();
    const { data: member } = await admin
      .from('members')
      .select('id')
      .eq('auth_id', user.id)
      .single();
    if (!member) {
      return NextResponse.json({ success: true, tickets: [] });
    }

    const { data: tickets, error } = await admin
      .from('help_tickets')
      .select('id, subject, status, unread_by_user, last_message_at, created_at')
      .eq('member_id', member.id)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Help tickets list error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tickets: (tickets || []).map((t) => ({
        id: t.id,
        subject: t.subject,
        status: t.status,
        unreadByUser: t.unread_by_user,
        lastMessageAt: t.last_message_at,
        createdAt: t.created_at,
      })),
    });
  } catch (error: unknown) {
    console.error('Help tickets GET error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}
