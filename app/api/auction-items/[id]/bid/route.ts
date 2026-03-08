import { NextRequest, NextResponse } from 'next/server';
import { getAuctionItemFromSupabase, updateAuctionItemInSupabase } from '@/lib/supabase-auction';
import { getLastBidsForItemFromSupabase } from '@/lib/supabase-bids';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/** Map Supabase bid row to ArtAllBidsMade shape */
function toBidShape(b: { id: string; item_id: string; bid_amount: number; bid_price: number; user_bid_count: number; user_bid_amount: number; user_bid_price_amount: number; bid_date: string; item_name?: string; member_email?: string; member_name?: string; member_username?: string }) {
  return {
    _id: b.id,
    itemId: b.item_id,
    bidAmount: Number(b.bid_amount),
    bidPrice: Number(b.bid_price),
    userBidCount: Number(b.user_bid_count),
    userBidAmount: Number(b.user_bid_amount),
    userBidPriceAmount: Number(b.user_bid_price_amount),
    bidDate: b.bid_date,
    memberEmail: b.member_email || '',
    memberName: b.member_name,
    memberUsername: b.member_username || '',
    memberId: '',
  };
}

async function handleSupabaseBid(
  itemId: string,
  body: any,
  authId: string
): Promise<NextResponse> {
  const admin = createAdminClient();
  const { data: member } = await admin
    .from('members')
    .select('id, email, full_name, star_bids, star_bids_consumed')
    .eq('auth_id', authId)
    .single();
  if (!member) {
    return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
  }

  const item = await getAuctionItemFromSupabase(itemId);
  if (!item) {
    return NextResponse.json({ success: false, error: 'Auction item not found' }, { status: 404 });
  }

  const now = new Date();
  const parseDate = (v: unknown): Date => {
    if (v == null) return new Date(NaN);
    if (typeof v === 'string' || typeof v === 'number') return new Date(v);
    if (v instanceof Date) return new Date(v.getTime());
    if (typeof v === 'object' && v !== null && '$date' in v) {
      const d = (v as { $date?: string }).$date;
      return new Date(typeof d === 'string' ? d : NaN);
    }
    return new Date(String(v));
  };
  let launch = parseDate(body.launchBidItemDate ?? item.launchBidItemDate);
  let endRaw = parseDate(body.auctionItemEndDate ?? item.auctionItemEndDate);
  const currentYear = now.getUTCFullYear();
  if (!Number.isNaN(launch.getTime()) && !Number.isNaN(endRaw.getTime()) &&
      launch.getUTCFullYear() === currentYear - 1 && endRaw.getUTCFullYear() === currentYear - 1) {
    const endMonthDay = endRaw.toISOString().slice(5, 10);
    const todayMonthDay = now.toISOString().slice(5, 10);
    if (endMonthDay >= todayMonthDay) {
      launch = new Date(Date.UTC(currentYear, launch.getUTCMonth(), launch.getUTCDate(), launch.getUTCHours(), launch.getUTCMinutes(), launch.getUTCSeconds(), launch.getUTCMilliseconds()));
      endRaw = new Date(Date.UTC(currentYear, endRaw.getUTCMonth(), endRaw.getUTCDate(), endRaw.getUTCHours(), endRaw.getUTCMinutes(), endRaw.getUTCSeconds(), endRaw.getUTCMilliseconds()));
    }
  }
  const end = new Date(Date.UTC(endRaw.getUTCFullYear(), endRaw.getUTCMonth(), endRaw.getUTCDate(), 23, 59, 59, 999));

  if (now < launch) {
    return NextResponse.json({ success: false, error: 'Auction has not started yet' }, { status: 400 });
  }
  if (now > end) {
    return NextResponse.json({ success: false, error: 'Auction has ended' }, { status: 400 });
  }

  const singleBidAmount = parseFloat(String(item.bidAmount || 0));
  const starBids = Number(member.star_bids) ?? 0;
  if (starBids < singleBidAmount) {
    return NextResponse.json(
      { success: false, error: 'Insufficient StarBids!', currentBalance: starBids, required: singleBidAmount },
      { status: 400 }
    );
  }

  const bidIncreaseRate = parseFloat(String(item.bidIncreaseRate || 0));
  const latestBidAmt = parseFloat(String(item.bidAmount || 0));
  const division = parseFloat(String(item.bidPriceDivision || 1));
  const newBidAmt = latestBidAmt + bidIncreaseRate;
  const newBidPrice = newBidAmt / division;
  const thisBidPrice = latestBidAmt / division;

  const { data: myBids } = await admin
    .from('auction_bids')
    .select('bid_amount, bid_price')
    .eq('item_id', itemId)
    .eq('member_id', member.id);
  const itemUserBids = myBids || [];
  const currentBidCount = itemUserBids.length;
  const currentBidAmount = itemUserBids.reduce((s, b) => s + Number(b.bid_amount), 0);
  const currentBidPriceTotal = itemUserBids.reduce((s, b) => s + Number(b.bid_price), 0);

  const newStarBids = starBids - singleBidAmount;
  const newStarBidsConsumed = (Number(member.star_bids_consumed) ?? 0) + singleBidAmount;

  await admin.from('members').update({ star_bids: newStarBids, star_bids_consumed: newStarBidsConsumed }).eq('id', member.id);

  const bidRecord = {
    item_id: itemId,
    member_id: member.id,
    bid_amount: latestBidAmt,
    bid_price: thisBidPrice,
    user_bid_count: currentBidCount + 1,
    user_bid_amount: currentBidAmount + singleBidAmount,
    user_bid_price_amount: currentBidPriceTotal + thisBidPrice,
    item_name: item.bidItemName,
    item_type: item.bidItemType,
    item_image: item.imageBidItem,
    member_email: member.email,
    member_name: member.full_name || undefined,
    member_username: member.full_name || '',
  };

  const { data: inserted, error } = await admin.from('auction_bids').insert(bidRecord).select('id, bid_date').single();
  if (error || !inserted) {
    console.error('Auction bid insert failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to save bid' }, { status: 500 });
  }

  const auctionUpdates = {
    bidAmount: newBidAmt,
    bidPrice: newBidPrice,
    allUsersBidCount: parseInt(String(item.allUsersBidCount || 0)) + 1,
    allUsersBidAmount: parseFloat(String(item.allUsersBidAmount || 0)) + singleBidAmount,
    allUsersBidPriceAmount: parseFloat(String(item.allUsersBidPriceAmount || 0)) + thisBidPrice,
  };
  updateAuctionItemInSupabase(itemId, auctionUpdates).catch((err: any) =>
    console.warn('Auction item stats update failed (bid succeeded):', err?.message)
  );

  const lastBids = await getLastBidsForItemFromSupabase(itemId, 5);

  return NextResponse.json({
    success: true,
    bid: {
      ...bidRecord,
      _id: inserted.id,
      bidDate: inserted.bid_date,
      memberId: member.id,
      memberEmail: member.email,
      memberName: member.full_name,
      memberUsername: member.full_name || '',
    },
    member: {
      memberId: member.id,
      starBids: newStarBids,
      starBidsConsumed: newStarBidsConsumed,
    },
    item: { ...item, ...auctionUpdates },
    lastBids,
    userBidStats: {
      count: currentBidCount + 1,
      amount: currentBidAmount + singleBidAmount,
      priceTotal: currentBidPriceTotal + thisBidPrice,
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Supabase path: authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return await handleSupabaseBid(params.id, body, user.id);
    }

    // Require Supabase auth for bidding (Wix removed)
    return NextResponse.json(
      { success: false, error: 'Please log in to place a bid.' },
      { status: 401 }
    );
  } catch (error: any) {
    console.error('Error processing bid:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process bid' },
      { status: 500 }
    );
  }
}
