import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/help-tickets/count - Unread tickets count for admin badge
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, count: 0 }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: member } = await admin
      .from('members')
      .select('id, role')
      .eq('auth_id', user.id)
      .single();

    const roleStr = (member?.role ?? '').toLowerCase();
    if (!member || !roleStr.includes('admin')) {
      return NextResponse.json({ success: false, count: 0 }, { status: 403 });
    }

    const { count, error } = await admin
      .from('help_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('unread_by_admin', true);

    if (error) {
      console.error('Admin help tickets count error:', error);
      return NextResponse.json({ success: true, count: 0 });
    }

    return NextResponse.json({ success: true, count: count ?? 0 });
  } catch (error: unknown) {
    console.error('Admin help tickets count error:', error);
    return NextResponse.json({ success: true, count: 0 });
  }
}
