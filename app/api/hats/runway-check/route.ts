import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/hats/runway-check?wixId=xxx - Check if a hat is part of a runway collection
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wixId = searchParams.get('wixId');
    if (!wixId) {
      return NextResponse.json(
        { success: false, error: 'wixId required' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: events } = await admin
      .from('runway_events')
      .select('id, title, event_date, hat_ids')
      .eq('status', 'past');

    const runwayTitle = (events || []).find((e: any) => {
      const ids = e.hat_ids || [];
      return ids.some((id: string) => String(id) === String(wixId));
    })?.title;

    return NextResponse.json({
      success: true,
      isRunwayCollection: !!runwayTitle,
      runwayTitle: runwayTitle || undefined,
    });
  } catch (error: unknown) {
    console.error('Runway check error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed' },
      { status: 500 }
    );
  }
}
