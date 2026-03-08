import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

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
    const { data: entries } = await supabase
      .from('raffle_entries')
      .select('ticket_number, members(full_name)')
      .eq('raffle_id', id)
      .not('ticket_number', 'is', null)
      .order('ticket_number');

    const tickets = (entries || []).map((e: { ticket_number: number; members?: unknown }) => {
      const m = Array.isArray(e.members) ? e.members[0] : e.members;
      const name = (m as { full_name?: string } | null)?.full_name || null;
      return {
        number: e.ticket_number,
        initials: getInitials(name),
        displayName: name || undefined,
      };
    });
    return NextResponse.json({ success: true, tickets });
  } catch (err) {
    console.error('Roulette data error:', err);
    return NextResponse.json(
      { success: false, tickets: [] },
      { status: 500 }
    );
  }
}
