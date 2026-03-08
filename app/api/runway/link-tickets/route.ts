import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/runway/link-tickets - Link unlinked tickets (with user's email) to their account
 * Call this when tickets were purchased without being logged in or before member_id was set.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Please log in.' },
        { status: 401 }
      );
    }

    const admin = createAdminClient();
    const { data: member, error: memberError } = await admin
      .from('members')
      .select('id, email')
      .eq('auth_id', user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { success: false, error: 'Member not found.' },
        { status: 404 }
      );
    }

    const emailLower = (member.email || '').toLowerCase().trim();
    const userEmailLower = (user.email || '').toLowerCase().trim();
    const emailsToMatch = [emailLower, userEmailLower].filter(Boolean);
    const uniqueEmails = [...new Set(emailsToMatch)];

    if (uniqueEmails.length === 0) {
      return NextResponse.json({ success: false, error: 'No email to match.' }, { status: 400 });
    }

    const { data: updated, error } = await admin
      .from('runway_tickets')
      .update({ member_id: member.id })
      .in('email', uniqueEmails)
      .is('member_id', null)
      .eq('payment_status', 'completed')
      .select('id, runway_event_id');

    if (error) {
      console.error('Link tickets error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const linked = updated?.length ?? 0;
    return NextResponse.json({
      success: true,
      linked,
      message: linked > 0 ? `Linked ${linked} ticket(s) to your account.` : 'No unlinked tickets found.',
    });
  } catch (error: unknown) {
    console.error('Link tickets error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed' },
      { status: 500 }
    );
  }
}
