import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  req: NextRequest,
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

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Please log in to claim your prize.' },
        { status: 401 }
      );
    }

    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('auth_id', user.id)
      .single();
    if (!member) {
      return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
    }

    const { data: raffle } = await supabase
      .from('raffles')
      .select('id, title, subtitle, hat_ids, winner_number')
      .eq('id', id)
      .single();
    if (!raffle || raffle.winner_number == null) {
      return NextResponse.json(
        { success: false, error: 'No winner for this raffle yet' },
        { status: 400 }
      );
    }

    const { data: myTickets } = await supabase
      .from('raffle_entries')
      .select('ticket_number')
      .eq('raffle_id', id)
      .eq('member_id', member.id)
      .not('ticket_number', 'is', null);
    const ticketNumbers = (myTickets || []).map((t) => t.ticket_number as number);
    if (!ticketNumbers.includes(raffle.winner_number)) {
      return NextResponse.json(
        { success: false, error: 'You are not the winner of this raffle' },
        { status: 403 }
      );
    }

    const { data: existing } = await supabase
      .from('raffle_claimed_prizes')
      .select('id')
      .eq('raffle_id', id)
      .eq('member_id', member.id)
      .single();
    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Prize already claimed',
        alreadyClaimed: true,
      });
    }

    const { error: insertErr } = await supabase
      .from('raffle_claimed_prizes')
      .insert({
        raffle_id: id,
        member_id: member.id,
        prize_details: {
          raffleName: raffle.title,
          raffleSubtitle: raffle.subtitle,
          winningTicketNumber: raffle.winner_number,
          hatIds: raffle.hat_ids || [],
          status: 'claimed',
        },
      });
    if (insertErr) {
      return NextResponse.json(
        { success: false, error: insertErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Prize claimed successfully!',
      claimedPrize: { raffleId: id },
    });
  } catch (err) {
    console.error('Claim prize error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to claim prize' },
      { status: 500 }
    );
  }
}
