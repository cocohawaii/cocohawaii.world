import { NextResponse } from 'next/server';
import type { Raffle } from '@/lib/wix-types';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    let query = supabase
      .from('raffles')
      .select('id, title, subtitle, ticket_price, max_entries, total_entries, ticket_limit_per_user, value_of_pot, start_date, end_date, visibility_date, draw_date, status, hat_ids');
    const { searchParams } = new URL(request.url);
    const adminView = searchParams.get('admin') === 'true';
    if (!adminView) {
      query = query.eq('status', 'active');
    }
    const { data } = await query.order('draw_date', { ascending: true });
    const raffles: Raffle[] = (data || []).map((r) => ({
      _id: r.id,
      name: r.title,
      subtitle: r.subtitle,
      ticketCostStars: Number(r.ticket_price) || 5,
      ticketLimit: r.max_entries || 100,
      ticketLimitPerUser: r.ticket_limit_per_user ?? undefined,
      valueOfPot: r.value_of_pot != null ? Number(r.value_of_pot) : undefined,
      startDate: r.start_date,
      endDate: r.end_date,
      visibilityDate: r.visibility_date || r.start_date,
      isActive: r.status === 'active',
      hatIds: (r.hat_ids as string[]) || [],
    }));
    return NextResponse.json({ success: true, raffles });
  } catch (error: unknown) {
    console.error('Error fetching raffles:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Failed to fetch raffles' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const toIso = (v: string) => (v ? new Date(v).toISOString() : new Date().toISOString());
    const title = (body.name || '').trim();
    if (!title) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }
    const endDate = toIso(body.endDate);
    const supabase = await createClient();
    const { data: inserted, error } = await supabase
      .from('raffles')
      .insert({
        title,
        subtitle: body.subtitle || null,
        status: body.isActive ?? true ? 'active' : 'draft',
        visibility_date: toIso(body.visibilityDate),
        start_date: toIso(body.startDate),
        end_date: endDate,
        draw_date: endDate,
        ticket_price: Number(body.ticketCostStars) || 5,
        max_entries: Number(body.ticketLimit) || 100,
        ticket_limit_per_user: Number(body.ticketLimitPerUser) || null,
        value_of_pot: Number(body.valueOfPot) || null,
        hat_ids: Array.isArray(body.hatIds) ? body.hatIds.filter((id: string) => /^[0-9a-f-]{36}$/i.test(id)) : [],
      })
      .select('id, title, subtitle, ticket_price, max_entries, ticket_limit_per_user, value_of_pot, start_date, end_date, visibility_date, draw_date, status')
      .single();
    if (error) {
      console.error('Supabase raffle insert error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    const raffle: Raffle = {
      _id: inserted.id,
      name: inserted.title,
      subtitle: inserted.subtitle ?? undefined,
      ticketCostStars: Number(inserted.ticket_price) || 5,
      ticketLimit: inserted.max_entries || 100,
      ticketLimitPerUser: inserted.ticket_limit_per_user ?? undefined,
      valueOfPot: inserted.value_of_pot != null ? Number(inserted.value_of_pot) : undefined,
      startDate: inserted.start_date,
      endDate: inserted.end_date,
      visibilityDate: inserted.visibility_date || inserted.start_date,
      isActive: inserted.status === 'active',
    };
    return NextResponse.json({ success: true, raffle });
  } catch (error: unknown) {
    console.error('Error creating raffle:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Failed to create raffle' }, { status: 500 });
  }
}
