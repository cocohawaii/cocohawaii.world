import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendHelpTicketReplyEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/admin/help-tickets/[id] - Get ticket with messages (admin)
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

    const { data: ticket, error: ticketError } = await admin
      .from('help_tickets')
      .select('id, subject, status, email, name, member_id, created_at, last_message_at, unread_by_admin')
      .eq('id', id)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found.' },
        { status: 404 }
      );
    }

    const { data: messages } = await admin
      .from('help_ticket_messages')
      .select('id, sender_type, body, created_at')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    // Mark as read by admin
    if (ticket.unread_by_admin) {
      await admin
        .from('help_tickets')
        .update({ unread_by_admin: false, updated_at: new Date().toISOString() })
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
      messages: (messages || []).map((m: any) => ({
        id: m.id,
        senderType: m.sender_type,
        body: m.body,
        createdAt: m.created_at,
      })),
    });
  } catch (error: unknown) {
    console.error('Admin help ticket GET error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/help-tickets/[id] - Admin reply (add message)
 * Body: { message, status? }
 * For anonymous users: sends email. For members: stores in DB, user sees in app.
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
    const status = body.status as string | undefined;

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: adminMember } = await admin
      .from('members')
      .select('id, role, full_name')
      .eq('auth_id', user.id)
      .single();

    const adminRoleStr = (adminMember?.role ?? '').toLowerCase();
    if (!adminMember || !adminRoleStr.includes('admin')) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const { data: ticket, error: ticketError } = await admin
      .from('help_tickets')
      .select('id, email, name, member_id, subject')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found.' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    const isMember = !!ticket.member_id;

    if (isMember) {
      // Member: store message in DB, user will see in app
      const { data: msg, error: msgError } = await admin
        .from('help_ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_type: 'admin',
          sender_member_id: adminMember.id,
          body: message,
        })
        .select('id, body, created_at')
        .single();

      if (msgError) {
        console.error('Admin reply message error:', msgError);
        return NextResponse.json(
          { success: false, error: msgError.message },
          { status: 500 }
        );
      }

      const updates: Record<string, unknown> = {
        last_message_at: now,
        updated_at: now,
        unread_by_admin: false,
        unread_by_user: true,
      };
      if (status && ['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
        updates.status = status;
      }

      await admin.from('help_tickets').update(updates).eq('id', ticketId);

      return NextResponse.json({
        success: true,
        message: {
          id: msg.id,
          body: msg.body,
          createdAt: msg.created_at,
          senderType: 'admin',
        },
      });
    }

    // Anonymous: send email reply, optionally store for admin's record
    const { data: msg } = await admin
      .from('help_ticket_messages')
      .insert({
        ticket_id: ticketId,
        sender_type: 'admin',
        sender_member_id: adminMember.id,
        body: message,
      })
      .select('id, body, created_at')
      .single();

    const updates: Record<string, unknown> = {
      last_message_at: now,
      updated_at: now,
      unread_by_admin: false,
    };
    if (status && ['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      updates.status = status;
    }
    await admin.from('help_tickets').update(updates).eq('id', ticketId);

    sendHelpTicketReplyEmail({
      to: ticket.email,
      name: ticket.name || 'there',
      subject: ticket.subject,
      replyBody: message,
      ticketId,
    }).catch((e) => console.error('Help ticket reply email failed:', e));

    return NextResponse.json({
      success: true,
      message: msg
        ? {
            id: msg.id,
            body: msg.body,
            createdAt: msg.created_at,
            senderType: 'admin',
            sentByEmail: true,
          }
        : { sentByEmail: true },
    });
  } catch (error: unknown) {
    console.error('Admin help ticket POST error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to send reply' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/help-tickets/[id] - Update ticket status
 */
export async function PATCH(
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
    const status = body.status as string | undefined;
    if (!status || !['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Valid status required (open, in_progress, resolved, closed).' },
        { status: 400 }
      );
    }

    const { error } = await admin
      .from('help_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Admin help ticket PATCH error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to update' },
      { status: 500 }
    );
  }
}
