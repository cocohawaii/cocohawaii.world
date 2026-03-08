import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/help-tickets - List all help tickets (admin only)
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

    const { data: tickets, error } = await admin
      .from('help_tickets')
      .select(`
        id,
        subject,
        status,
        email,
        name,
        member_id,
        unread_by_admin,
        last_message_at,
        created_at,
        members (full_name, email)
      `)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Admin help tickets list error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const list = (tickets || []).map((t: any) => ({
      id: t.id,
      subject: t.subject,
      status: t.status,
      email: t.email,
      name: t.name || (t.members?.full_name ?? null),
      isMember: !!t.member_id,
      unreadByAdmin: t.unread_by_admin,
      lastMessageAt: t.last_message_at,
      createdAt: t.created_at,
    }));

    return NextResponse.json({ success: true, tickets: list });
  } catch (error: unknown) {
    console.error('Admin help tickets GET error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}
