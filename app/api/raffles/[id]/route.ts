import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid raffle ID' }, { status: 400 });
    }
    const body = await request.json();
    const supabase = await createClient();
    const updates: Record<string, unknown> = {};
    if (Array.isArray(body.hatIds)) {
      updates.hat_ids = body.hatIds.filter((x: string) => isUuid(x));
    } else if (Array.isArray(body.hatIdsToAdd)) {
      const { data: existing } = await supabase.from('raffles').select('hat_ids').eq('id', id).single();
      const current = (existing?.hat_ids as string[]) || [];
      const merged = [...new Set([...current, ...body.hatIdsToAdd.filter((x: string) => isUuid(x))])];
      updates.hat_ids = merged;
    }
    if (body.name != null) updates.title = body.name;
    if (body.subtitle != null) updates.subtitle = body.subtitle;
    if (body.isActive != null) updates.status = body.isActive ? 'active' : 'draft';
    if (body.visibilityDate != null) updates.visibility_date = body.visibilityDate;
    if (body.startDate != null) updates.start_date = body.startDate;
    if (body.endDate != null) {
      updates.end_date = body.endDate;
      updates.draw_date = body.endDate;
    }
    if (body.ticketLimit != null) updates.max_entries = body.ticketLimit;
    if (body.ticketCostStars != null) updates.ticket_price = body.ticketCostStars;
    if (body.ticketLimitPerUser != null) updates.ticket_limit_per_user = body.ticketLimitPerUser;
    if (body.valueOfPot != null) updates.value_of_pot = body.valueOfPot;

    const { data: updated, error } = await supabase
      .from('raffles')
      .update(updates)
      .eq('id', id)
      .select('id, title, subtitle, ticket_price, max_entries, ticket_limit_per_user, value_of_pot, start_date, end_date, visibility_date, draw_date, status')
      .single();
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      raffle: {
        _id: updated.id,
        name: updated.title,
        subtitle: updated.subtitle,
        ticketCostStars: Number(updated.ticket_price),
        ticketLimit: updated.max_entries,
        ticketLimitPerUser: updated.ticket_limit_per_user,
        valueOfPot: updated.value_of_pot != null ? Number(updated.value_of_pot) : undefined,
        startDate: updated.start_date,
        endDate: updated.end_date,
        visibilityDate: updated.visibility_date,
        isActive: updated.status === 'active',
      },
    });
  } catch (error: unknown) {
    console.error('Error updating raffle:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Failed to update raffle' }, { status: 500 });
  }
}
