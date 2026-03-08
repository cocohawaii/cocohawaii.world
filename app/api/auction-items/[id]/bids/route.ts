import { NextRequest, NextResponse } from 'next/server';
import { getLastBidsForItemFromSupabase, getBidsForMemberFromSupabase } from '@/lib/supabase-bids';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    const admin = createAdminClient();

    // Last bids: Supabase auction_bids + legacy_auction_bids
    const lastBids = await getLastBidsForItemFromSupabase(params.id, limit);

    // User bids: Supabase members only
    let userBids: Awaited<ReturnType<typeof getBidsForMemberFromSupabase>> = [];
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: member } = await admin.from('members').select('id').eq('auth_id', user.id).single();
      if (member) {
        const allUserBids = await getBidsForMemberFromSupabase(member.id);
        userBids = allUserBids.filter(b => b.itemId === params.id);
      }
    }

    return NextResponse.json({
      success: true,
      lastBids,
      userBids,
      userBidStats: userBids.length > 0 ? {
        count: userBids.length,
        amount: userBids.reduce((sum, b) => sum + parseFloat(String(b.bidAmount || 0)), 0),
        priceTotal: userBids.reduce((sum, b) => sum + parseFloat(String(b.bidPrice || 0)), 0),
      } : null,
    });
  } catch (error: any) {
    console.error('Error fetching bids:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch bids' },
      { status: 500 }
    );
  }
}
