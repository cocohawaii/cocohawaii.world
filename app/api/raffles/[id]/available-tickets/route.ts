import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const dynamic = 'force-dynamic';

/**
 * GET /api/raffles/[id]/available-tickets
 * Returns sold ticket numbers and max tickets for the raffle.
 * Used by ticket picker to show which numbers are available.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ success: false, error: 'Invalid raffle ID' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: raffle, error: raffleErr } = await supabase
      .from('raffles')
      .select('max_entries, total_entries, status')
      .eq('id', id)
      .single();

    if (raffleErr || !raffle) {
      return NextResponse.json({ success: false, error: 'Raffle not found' }, { status: 404 });
    }

    const maxTickets = raffle.max_entries ?? 100;
    const { data: entries } = await supabase
      .from('raffle_entries')
      .select('ticket_number')
      .eq('raffle_id', id)
      .not('ticket_number', 'is', null);

    const soldNumbers = (entries || [])
      .map((e) => e.ticket_number as number)
      .filter((n): n is number => typeof n === 'number' && n >= 1 && n <= maxTickets);

    return NextResponse.json({
      success: true,
      maxTickets,
      soldNumbers,
      availableCount: Math.max(0, maxTickets - soldNumbers.length),
    });
  } catch (err) {
    console.error('Available tickets error:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 500 });
  }
}
