import { NextRequest, NextResponse } from 'next/server';
import { getBidsForMemberFromSupabase } from '@/lib/supabase-bids';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const byEmail = searchParams.get('byEmail') === 'true';

    const admin = createAdminClient();
    let memberId: string | null = null;
    if (byEmail || params.id.includes('@')) {
      const { data: m } = await admin.from('members').select('id').eq('email', params.id.toLowerCase().trim()).maybeSingle();
      memberId = m?.id ?? null;
    } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id)) {
      memberId = params.id;
    }
    const bids = memberId ? await getBidsForMemberFromSupabase(memberId) : [];
    
    if (bids.length === 0) {
      return NextResponse.json({
        success: true,
        stats: {
          totalBids: 0,
          totalStars: 0,
          totalValue: 0,
          itemsBidOn: 0,
          recentBids: []
        }
      });
    }

    // Calculate stats
    const totalBids = bids.length;
    const totalStars = bids.reduce((sum, b) => sum + parseFloat(String(b.bidAmount || 0)), 0);
    const totalValue = bids.reduce((sum, b) => sum + parseFloat(String(b.bidPrice || 0)), 0);
    
    // Count unique items bid on
    const uniqueItems = new Set(bids.map(b => b.itemId));
    const itemsBidOn = uniqueItems.size;

    // Get recent bids (last 10, sorted by date)
    const recentBids = bids
      .sort((a, b) => {
        const dateA = new Date(a.bidDate).getTime();
        const dateB = new Date(b.bidDate).getTime();
        return dateB - dateA;
      })
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      stats: {
        totalBids,
        totalStars,
        totalValue,
        itemsBidOn,
        recentBids
      }
    });
  } catch (error: any) {
    console.error('Error fetching bid stats:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch bid stats' },
      { status: 500 }
    );
  }
}
