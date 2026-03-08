import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/help-tickets/[id] - Get a single ticket with messages
 * User can only access their own tickets.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ticket ID.' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Please log in to view this ticket.' },
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
      return NextResponse.json({ success: false, error: 'Member not found.' }, { status: 404 });
    }

    const { data: ticket, error: ticketError } = await admin
      .from('help_tickets')
      .select('id, subject, status, email, name, member_id, created_at, last_message_at')
      .eq('id', id)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found.' },
        { status: 404 }
      );
    }

    if (ticket.member_id !== member.id) {
      return NextResponse.json(
        { success: false, error: 'You do not have access to this ticket.' },
        { status: 403 }
      );
    }

    const { data: messages, error: msgError } = await admin
      .from('help_ticket_messages')
      .select('id, sender_type, body, created_at')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    if (msgError) {
      console.error('Help ticket messages error:', msgError);
    }

    // Mark as read by user
    if (ticket.unread_by_user) {
      await admin
        .from('help_tickets')
        .update({ unread_by_user: false, updated_at: new Date().toISOString() })
        .eq('id', id);
    }

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        email: ticket.email,
        name: ticket.name,
        isMember: !!ticket.member_id,
        createdAt: ticket.created_at,
        lastMessageAt: ticket.last_message_at,
      },
      messages: (messages || []).map((m) => ({
        id: m.id,
        senderType: m.sender_type,
        body: m.body,
        createdAt: m.created_at,
      })),
    });
  } catch (error: unknown) {
    console.error('Help ticket GET error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}
