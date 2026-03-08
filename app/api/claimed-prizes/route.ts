import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Please log in to view your claimed prizes.' },
        { status: 401 }
      );
    }

    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json({ success: true, prizes: [] });
    }

    const admin = createAdminClient();
    const { data: rows } = await admin
      .from('raffle_claimed_prizes')
      .select('id, raffle_id, prize_details, claimed_at')
      .eq('member_id', member.id)
      .order('claimed_at', { ascending: false });

    const prizes = (rows || []).map((r: any) => {
      const d = r.prize_details || {};
      return {
        _id: r.id,
        raffleId: r.raffle_id,
        raffleName: d.raffleName || 'Raffle',
        raffleSubtitle: d.raffleSubtitle,
        winningTicketNumber: d.winningTicketNumber ?? 0,
        hatIds: d.hatIds || [],
        status: d.status || 'claimed',
        claimedAt: r.claimed_at,
      };
    });

    return NextResponse.json({ success: true, prizes });
  } catch (err) {
    console.error('Claimed prizes error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch claimed prizes' },
      { status: 500 }
    );
  }
}
