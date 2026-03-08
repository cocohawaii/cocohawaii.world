import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/runway/collection - List past runways with revealed items (for Runway Collection page)
 */
export async function GET() {
  try {
    const admin = createAdminClient();
    const now = new Date();

    const { data: events, error } = await admin
      .from('runway_events')
      .select('id, title, subtitle, event_date, start_time, hat_ids, items_reveal_hours_after_start')
      .eq('status', 'past')
      .order('event_date', { ascending: false });

    if (error) {
      console.error('Runway collection error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const runways = (events || [])
      .map((e: any) => {
        const revealHours = e.items_reveal_hours_after_start ?? 0;
        const timePart = e.start_time ? String(e.start_time).padEnd(8, ':00').slice(0, 8) : '00:00:00';
        const eventStart = new Date(`${e.event_date}T${timePart}`);
        const revealAt = new Date(eventStart.getTime() + revealHours * 60 * 60 * 1000);
        const itemsRevealed = now >= revealAt;
        const hatIds = itemsRevealed ? (e.hat_ids || []) : [];
        return {
          id: e.id,
          title: e.title,
          subtitle: e.subtitle,
          eventDate: e.event_date,
          startTime: e.start_time,
          itemsRevealed,
          hatIds,
        };
      })
      .filter((r: { itemsRevealed: boolean; hatIds: string[] }) => r.itemsRevealed && (r.hatIds?.length ?? 0) > 0);

    return NextResponse.json({ success: true, runways });
  } catch (error: unknown) {
    console.error('Runway collection error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch' },
      { status: 500 }
    );
  }
}
