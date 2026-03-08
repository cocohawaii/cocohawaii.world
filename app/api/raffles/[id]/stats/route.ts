import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    const { data: raffle, error } = await supabase
      .from('raffles')
      .select('total_entries')
      .eq('id', id)
      .single();

    if (error || !raffle) {
      return NextResponse.json(
        { success: false, error: 'Raffle not found' },
        { status: 404 }
      );
    }

    const { data: entries } = await supabase
      .from('raffle_entries')
      .select('member_id')
      .eq('raffle_id', id);
    const uniqueHolders = new Set((entries || []).map((e) => e.member_id)).size;

    return NextResponse.json({
      success: true,
      ticketsSold: raffle.total_entries ?? 0,
      uniqueHolders,
    });
  } catch (err) {
    console.error('Raffle stats error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch raffle stats' },
      { status: 500 }
    );
  }
}
