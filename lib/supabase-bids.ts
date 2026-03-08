/**
 * Supabase-backed auction bids (merges auction_bids + legacy_auction_bids)
 */
import { createAdminClient } from '@/lib/supabase/admin';
import type { ArtAllBidsMade } from '@/lib/wix-types';

function toBidShape(b: {
  id: string;
  item_id: string;
  bid_amount: number;
  bid_price: number;
  user_bid_count: number;
  user_bid_amount: number;
  user_bid_price_amount: number;
  bid_date: string;
  item_name?: string;
  member_email?: string;
  member_name?: string;
  member_username?: string;
}): ArtAllBidsMade {
  return {
    _id: b.id,
    itemId: b.item_id,
    itemName: b.item_name || '',
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

function toLegacyBidShape(b: {
  id: string;
  item_id: string;
  bid_amount: number;
  bid_price: number;
  user_bid_count: number;
  user_bid_amount: number;
  user_bid_price_amount: number;
  bid_date: string;
  item_name?: string;
  member_email?: string;
  member_name?: string;
  member_username?: string;
}): ArtAllBidsMade {
  return toBidShape(b);
}

export async function getLastBidsForItemFromSupabase(itemId: string, limit = 5): Promise<ArtAllBidsMade[]> {
  const admin = createAdminClient();
  const [sbRes, legacyRes] = await Promise.all([
    admin
      .from('auction_bids')
      .select('id, item_id, bid_amount, bid_price, user_bid_count, user_bid_amount, user_bid_price_amount, bid_date, item_name, member_email, member_name, member_username')
      .eq('item_id', itemId)
      .order('bid_date', { ascending: false })
      .limit(limit * 2),
    admin
      .from('legacy_auction_bids')
      .select('id, item_id, bid_amount, bid_price, user_bid_count, user_bid_amount, user_bid_price_amount, bid_date, item_name, member_email, member_name, member_username')
      .eq('item_id', itemId)
      .order('bid_date', { ascending: false })
      .limit(limit * 2),
  ]);
  const sbBids = (sbRes.data || []).map(toBidShape);
  const legacyBids = (legacyRes.data || []).map(toLegacyBidShape);
  const merged = [...sbBids, ...legacyBids];
  merged.sort((a, b) => new Date(b.bidDate).getTime() - new Date(a.bidDate).getTime());
  return merged.slice(0, limit);
}

export async function getBidsForMemberFromSupabase(memberId: string): Promise<ArtAllBidsMade[]> {
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from('auction_bids')
    .select('id, item_id, bid_amount, bid_price, user_bid_count, user_bid_amount, user_bid_price_amount, bid_date, item_name, member_email, member_name, member_username')
    .eq('member_id', memberId)
    .order('bid_date', { ascending: false });
  return (rows || []).map(toBidShape);
}
