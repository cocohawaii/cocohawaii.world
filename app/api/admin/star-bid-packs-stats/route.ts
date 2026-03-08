import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();

    // Verify admin
    const { data: member } = await admin
      .from('members')
      .select('role')
      .eq('auth_id', user.id)
      .single();

    if (!member || member.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [packsRes, purchasesRes, ordersRes] = await Promise.all([
      admin.from('star_bid_packs').select('id, pack_id, name, detail, stars_amount, price').eq('active', true),
      admin.from('star_bid_pack_purchases').select('pack_id, pack_name, quantity, total_stars, total_price_eur, created_at').order('created_at', { ascending: false }).limit(2000),
      admin
        .from('star_bid_pack_purchases')
        .select('id, pack_id, pack_name, quantity, total_stars, total_price_eur, created_at, members(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(500),
    ]);

    const packs = packsRes.data || [];
    const purchases = purchasesRes.data || [];
    const ordersRaw = ordersRes.data || [];
    const orders = ordersRaw.map((o: any) => ({
      id: o.id,
      packId: o.pack_id,
      packName: o.pack_name || o.pack_id,
      quantity: Number(o.quantity) || 0,
      totalStars: Number(o.total_stars) || 0,
      totalPriceEUR: Number(o.total_price_eur) || 0,
      createdAt: o.created_at || '',
      memberName: o.members?.full_name || '—',
      memberEmail: o.members?.email || '—',
    }));

    const statsByPack: Record<
      string,
      {
        packId: string;
        packName: string;
        packDetail?: string;
        starsAmount: number;
        price: number;
        salesCount: number;
        quantitySold: number;
        totalStarsSold: number;
        totalRevenue: number;
        purchases: { quantity: number; totalPriceEUR: number; orderDate: string }[];
      }
    > = {};

    for (const pack of packs) {
      const packId = pack.pack_id;
      statsByPack[packId] = {
        packId,
        packName: pack.name || 'Unknown',
        packDetail: pack.detail ?? undefined,
        starsAmount: Number(pack.stars_amount) || 0,
        price: Number(pack.price) || 0,
        salesCount: 0,
        quantitySold: 0,
        totalStarsSold: 0,
        totalRevenue: 0,
        purchases: [],
      };
    }

    for (const p of purchases) {
      const packId = p.pack_id;
      if (!statsByPack[packId]) {
        statsByPack[packId] = {
          packId,
          packName: p.pack_name || 'Unknown',
          packDetail: undefined,
          starsAmount: 0,
          price: 0,
          salesCount: 0,
          quantitySold: 0,
          totalStarsSold: 0,
          totalRevenue: 0,
          purchases: [],
        };
      }
      const qty = Number(p.quantity) || 0;
      const rev = Number(p.total_price_eur) || 0;
      const stars = Number(p.total_stars) || 0;
      statsByPack[packId].salesCount += 1;
      statsByPack[packId].quantitySold += qty;
      statsByPack[packId].totalStarsSold += stars;
      statsByPack[packId].totalRevenue += rev;
      statsByPack[packId].purchases.push({
        quantity: qty,
        totalPriceEUR: rev,
        orderDate: p.created_at || '',
      });
    }

    const packStats = Object.values(statsByPack);
    const totals = {
      totalSales: packStats.reduce((s, p) => s + p.salesCount, 0),
      totalQuantitySold: packStats.reduce((s, p) => s + p.quantitySold, 0),
      totalStarsSold: packStats.reduce((s, p) => s + p.totalStarsSold, 0),
      totalRevenue: packStats.reduce((s, p) => s + p.totalRevenue, 0),
    };

    return NextResponse.json({
      success: true,
      packs: packStats,
      totals,
      orders,
    });
  } catch (error: any) {
    console.error('Error fetching star bid pack stats:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
