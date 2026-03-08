/**
 * Supabase-backed auction items (replaces Wix ArtCreationBidding)
 */
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { convertWixImageUrl } from '@/lib/wix-utils';
import type { ArtCreationBidding } from '@/lib/wix-types';

function mapRowToItem(row: Record<string, unknown>): ArtCreationBidding {
  const img = row.image_bid_item as string | undefined;
  return {
    _id: String(row.wix_id),
    itemAuctionId: row.item_auction_id as string | undefined,
    bidItemName: String(row.bid_item_name || ''),
    bidItemType: row.bid_item_type as string | undefined,
    imageBidItem: convertWixImageUrl(img) || img,
    launchBidItemDate: (row.launch_bid_item_date as string) || '',
    auctionItemEndDate: (row.auction_item_end_date as string) || '',
    auctionItemVisibleDate: row.auction_item_visible_date as string | undefined,
    activeBidItem: row.active_bid_item !== false,
    bidAmount: Number(row.bid_amount) || 0,
    bidPrice: Number(row.bid_price) || 0,
    bidIncreaseRate: Number(row.bid_increase_rate) || 0,
    bidPriceDivision: row.bid_price_division != null ? Number(row.bid_price_division) : undefined,
    artBasePrice: Number(row.art_base_price) || 0,
    artPriceIncrease: String(row.art_price_increase ?? ''),
    increaseRate: Number(row.increase_rate) || 6400,
    artPriceIncreasedTotalCount: row.art_price_increased_total_count as number | undefined,
    artPriceIncreasedTotal: row.art_price_increased_total as string | undefined,
    artPriceFinalTotal: row.art_price_final_total as string | undefined,
    totalCountdown: String(row.total_countdown ?? ''),
    totalCountDone: row.total_count_done as string | undefined,
    totalCountdownLeft: row.total_countdown_left as string | undefined,
    totalTimeElapsedMs: row.total_time_elapsed_ms as number | undefined,
    allUsersBidCount: row.all_users_bid_count as number | undefined,
    allUsersBidAmount: row.all_users_bid_amount as number | undefined,
    allUsersBidPriceAmount: row.all_users_bid_price_amount as number | undefined,
    tagItemType: row.tag_item_type as string | string[] | undefined,
  };
}

function toDbUpdates(updates: Partial<ArtCreationBidding>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (updates.artPriceIncreasedTotalCount != null) out.art_price_increased_total_count = updates.artPriceIncreasedTotalCount;
  if (updates.artPriceIncreasedTotal != null) out.art_price_increased_total = updates.artPriceIncreasedTotal;
  if (updates.artPriceFinalTotal != null) out.art_price_final_total = updates.artPriceFinalTotal;
  if (updates.totalCountDone != null) out.total_count_done = updates.totalCountDone;
  if (updates.totalCountdownLeft != null) out.total_countdown_left = updates.totalCountdownLeft;
  if (updates.totalTimeElapsedMs != null) out.total_time_elapsed_ms = updates.totalTimeElapsedMs;
  if (updates.bidAmount != null) out.bid_amount = updates.bidAmount;
  if (updates.bidPrice != null) out.bid_price = updates.bidPrice;
  if (updates.allUsersBidCount != null) out.all_users_bid_count = updates.allUsersBidCount;
  if (updates.allUsersBidAmount != null) out.all_users_bid_amount = updates.allUsersBidAmount;
  if (updates.allUsersBidPriceAmount != null) out.all_users_bid_price_amount = updates.allUsersBidPriceAmount;
  out.updated_at = new Date().toISOString();
  return out;
}

export async function getAuctionItemsFromSupabase(activeOnly = true): Promise<ArtCreationBidding[]> {
  const supabase = await createClient();
  let query = supabase.from('auction_items').select('*').order('launch_bid_item_date', { ascending: true });
  if (activeOnly) {
    query = query.eq('active_bid_item', true);
  }
  const { data: rows, error } = await query.limit(1000);
  if (error) {
    console.error('getAuctionItemsFromSupabase error:', error);
    return [];
  }
  return (rows || []).map((r) => mapRowToItem(r as Record<string, unknown>));
}

export async function getAuctionItemFromSupabase(itemId: string): Promise<ArtCreationBidding | null> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from('auction_items')
    .select('*')
    .eq('wix_id', itemId)
    .maybeSingle();
  if (error || !row) return null;
  return mapRowToItem(row as Record<string, unknown>);
}

export async function updateAuctionItemInSupabase(itemId: string, updates: Partial<ArtCreationBidding>): Promise<void> {
  const admin = createAdminClient();
  const dbUpdates = toDbUpdates(updates);
  const { error } = await admin
    .from('auction_items')
    .update(dbUpdates)
    .eq('wix_id', itemId);
  if (error) throw error;
}
