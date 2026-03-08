import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: true, ticketNumbers: [] });
    }

    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('auth_id', user.id)
      .single();
    if (!member) {
      return NextResponse.json({ success: true, ticketNumbers: [] });
    }

    const { data: entries } = await supabase
      .from('raffle_entries')
      .select('ticket_number')
      .eq('raffle_id', id)
      .eq('member_id', member.id)
      .not('ticket_number', 'is', null)
      .order('ticket_number');
    const ticketNumbers = (entries || []).map((e) => e.ticket_number as number).filter(Boolean);

    return NextResponse.json({ success: true, ticketNumbers });
  } catch (err) {
    console.error('My tickets error:', err);
    return NextResponse.json(
      { success: false, ticketNumbers: [] },
      { status: 500 }
    );
  }
}
