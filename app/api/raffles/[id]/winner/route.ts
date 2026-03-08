import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendRaffleWinnerEmail } from '@/lib/email';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getInitials(name: string | null): string {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Raffle ID required' }, { status: 400 });
    }
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ success: false, error: 'Invalid raffle ID' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: raffle, error: raffleErr } = await supabase
      .from('raffles')
      .select('id, title, end_date, start_date, total_entries, winner_number, winner_initials, winner_display_name')
      .eq('id', id)
      .single();

    if (raffleErr || !raffle) {
      return NextResponse.json({ success: false, error: 'Raffle not found' }, { status: 404 });
    }

    const now = new Date();
    const endDate = new Date(raffle.end_date);
    const startDate = new Date(raffle.start_date);
    const isEnded = now > endDate;
    const isLive = now >= startDate && now <= endDate;
    const secondsLeft = isLive ? Math.floor((endDate.getTime() - now.getTime()) / 1000) : 0;
    const inRouletteWindow = isLive && secondsLeft <= 60 && secondsLeft > 0;

    if (!isEnded && !inRouletteWindow) {
      return NextResponse.json({
        success: true,
        winner: null,
        message: 'Raffle has not ended and is not in winner-pick window',
      });
    }

    if (raffle.winner_number != null) {
      return NextResponse.json({
        success: true,
        winner: {
          number: raffle.winner_number,
          initials: raffle.winner_initials || '?',
          displayName: raffle.winner_display_name || undefined,
        },
      });
    }

    const { data: entries } = await supabase
      .from('raffle_entries')
      .select('ticket_number, member_id, members(full_name)')
      .eq('raffle_id', id)
      .not('ticket_number', 'is', null);

    if (!entries || entries.length === 0) {
      return NextResponse.json({ success: true, winner: null, message: 'No entries' });
    }

    const winnerEntry = entries[Math.floor(Math.random() * entries.length)]!;
    const member = winnerEntry.members as { full_name?: string } | null;
    const displayName = member?.full_name || null;
    const initials = getInitials(displayName);

    await supabase
      .from('raffles')
      .update({
        winner_number: winnerEntry.ticket_number,
        winner_initials: initials,
        winner_display_name: displayName,
      })
      .eq('id', id);

    const { data: winnerMember } = await supabase
      .from('members')
      .select('email, full_name')
      .eq('id', winnerEntry.member_id)
      .single();
    const winnerEmail = winnerMember?.email;
    if (winnerEmail) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cocohawaii.world';
      sendRaffleWinnerEmail(
        winnerEmail,
        winnerMember?.full_name || displayName || 'Winner',
        raffle.title || 'Raffle',
        siteUrl
      ).catch((e) => console.warn('Raffle winner email failed (non-blocking):', e));
    }

    return NextResponse.json({
      success: true,
      winner: {
        number: winnerEntry.ticket_number,
        initials,
        displayName: displayName || undefined,
      },
    });
  } catch (err) {
    console.error('Raffle winner error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to get winner' },
      { status: 500 }
    );
  }
}
