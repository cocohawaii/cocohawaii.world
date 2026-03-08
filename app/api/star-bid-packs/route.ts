import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function toNum(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? 0));
  return Number.isFinite(n) ? n : 0;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: packs, error } = await supabase
      .from('star_bid_packs')
      .select('id, pack_id, name, detail, stars_amount, price, active')
      .eq('active', true);

    if (error) {
      console.error('Error fetching star bid packs:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Map to frontend shape (bidPacksId, bidPacksName, etc.)
    const mapped = (packs || []).map((p) => ({
      _id: p.id,
      bidPacksId: p.pack_id,
      bidPacksName: p.name,
      bidPackDetail: p.detail ?? undefined,
      bidPacksStarsAmount: toNum(p.stars_amount),
      bidPacksPrice: toNum(p.price),
      activeBidPack: true,
    }));

    return NextResponse.json({ success: true, packs: mapped });
  } catch (error: any) {
    console.error('Error fetching star bid packs:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
