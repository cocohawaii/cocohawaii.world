import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint: returns hats with is_sold=true to verify the column works.
 * Open /api/hats/verify-sold in browser to check.
 */
export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: rows, error } = await admin
      .from('hats')
      .select('wix_id, title, is_sold, is_active')
      .eq('is_sold', true);

    if (error) {
      return NextResponse.json({
        ok: false,
        error: error.message,
        hint: "If error mentions 'is_sold', run supabase/PHASE12_HATS_IS_SOLD.sql in Supabase SQL Editor",
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      soldCount: rows?.length ?? 0,
      soldHats: rows ?? [],
    });
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      error: e?.message || 'Unknown error',
    }, { status: 500 });
  }
}
