import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toPurchaseShape(row: { id: string; pack_id: string; pack_name: string | null; quantity: number; total_stars: number; total_price_eur: number; payment_status: string; payment_method: string | null; created_at: string }) {
  return {
    _id: row.id,
    bidPackId: row.pack_id,
    bidPackName: row.pack_name || row.pack_id,
    quantity: Number(row.quantity),
    totalStars: Number(row.total_stars),
    totalPriceEUR: Number(row.total_price_eur),
    orderDate: row.created_at,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method || undefined,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ success: false, error: 'Invalid member ID' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: rows } = await admin
      .from('star_bid_pack_purchases')
      .select('id, pack_id, pack_name, quantity, total_stars, total_price_eur, payment_status, payment_method, created_at')
      .eq('member_id', id)
      .order('created_at', { ascending: false })
      .limit(100);

    const purchases = (rows || []).map(toPurchaseShape);
    return NextResponse.json({ success: true, purchases });
  } catch (error: unknown) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch purchases' },
      { status: 500 }
    );
  }
}
