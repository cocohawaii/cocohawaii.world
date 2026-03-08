import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/help-tickets/[id]/messages - Add a message to a ticket
 * Only the ticket owner (user) can add messages. Admin replies go through admin API.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;
    if (!UUID_REGEX.test(ticketId)) {
      return NextResponse.json({ success: false, error: 'Invalid ticket ID.' }, { status: 400 });
    }

    const body = await request.json();
    const message = String(body.message || body.body || '').trim();
    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Please log in to reply.' },
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
      .select('id, member_id')
      .eq('id', ticketId)
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

    const now = new Date().toISOString();
    const { data: msg, error: msgError } = await admin
      .from('help_ticket_messages')
      .insert({
        ticket_id: ticketId,
        sender_type: 'user',
        sender_member_id: member.id,
        body: message,
      })
      .select('id, body, created_at')
      .single();

    if (msgError) {
      console.error('Help ticket message error:', msgError);
      return NextResponse.json(
        { success: false, error: msgError.message },
        { status: 500 }
      );
    }

    await admin
      .from('help_tickets')
      .update({
        last_message_at: now,
        updated_at: now,
        unread_by_admin: true,
        unread_by_user: false,
      })
      .eq('id', ticketId);

    return NextResponse.json({
      success: true,
      message: {
        id: msg.id,
        body: msg.body,
        createdAt: msg.created_at,
        senderType: 'user',
      },
    });
  } catch (error: unknown) {
    console.error('Help ticket message POST error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to send message' },
      { status: 500 }
    );
  }
}
