/**
 * Phase 5: Export ArtCreationBidding from Wix to Supabase auction_items
 *
 * POST /api/admin/migrate-auction-items
 * Requires: Admin auth (Supabase session)
 *
 * Run after applying: supabase/PHASE5_AUCTION_ITEMS_SQL_EDITOR.sql
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { fetchWixData } from '@/lib/wix';

const COLLECTION_CANDIDATES = ['Copy of ArtCreationBidding', 'ArtCreationBidding'];

function parseDate(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return new Date(v).toISOString();
  if (typeof v === 'object' && v !== null && '$date' in v) {
    const d = (v as { $date?: string }).$date;
    return typeof d === 'string' ? d : null;
  }
  return null;
}

function mapWixToSupabase(item: any): Record<string, unknown> {
  const d = item?.data ?? item;
  const wixId = String(item?._id ?? d?._id ?? '');
  return {
    wix_id: wixId,
    item_auction_id: d?.itemAuctionId ?? null,
    bid_item_name: String(d?.bidItemName ?? ''),
    bid_item_type: d?.bidItemType ?? null,
    image_bid_item: d?.imageBidItem ?? null,
    launch_bid_item_date: parseDate(d?.launchBidItemDate) ?? new Date().toISOString(),
    auction_item_end_date: parseDate(d?.auctionItemEndDate) ?? new Date().toISOString(),
    auction_item_visible_date: parseDate(d?.auctionItemVisibleDate),
    active_bid_item: d?.activeBidItem !== false,
    bid_amount: parseFloat(String(d?.bidAmount ?? 0)) || 0,
    bid_price: parseFloat(String(d?.bidPrice ?? 0)) || 0,
    bid_increase_rate: parseFloat(String(d?.bidIncreaseRate ?? 0)) || 0,
    bid_price_division: parseFloat(String(d?.bidPriceDivision ?? 1)) || 1,
    art_base_price: parseFloat(String(d?.artBasePrice ?? 0)) || 0,
    art_price_increase: d?.artPriceIncrease ? String(d.artPriceIncrease) : null,
    increase_rate: parseInt(String(d?.increaseRate ?? 6400), 10) || 6400,
    art_price_increased_total_count: d?.artPriceIncreasedTotalCount != null ? Number(d.artPriceIncreasedTotalCount) : null,
    art_price_increased_total: d?.artPriceIncreasedTotal != null ? String(d.artPriceIncreasedTotal) : null,
    art_price_final_total: d?.artPriceFinalTotal != null ? String(d.artPriceFinalTotal) : null,
    total_countdown: d?.totalCountdown ? String(d.totalCountdown) : null,
    total_count_done: d?.totalCountDone ? String(d.totalCountDone) : null,
    total_countdown_left: d?.totalCountdownLeft ? String(d.totalCountdownLeft) : null,
    total_time_elapsed_ms: d?.totalTimeElapsedMs != null ? Number(d.totalTimeElapsedMs) : null,
    all_users_bid_count: d?.allUsersBidCount != null ? Number(d.allUsersBidCount) : null,
    all_users_bid_amount: d?.allUsersBidAmount != null ? parseFloat(String(d.allUsersBidAmount)) : null,
    all_users_bid_price_amount: d?.allUsersBidPriceAmount != null ? parseFloat(String(d.allUsersBidPriceAmount)) : null,
    tag_item_type: Array.isArray(d?.tagItemType) ? d.tagItemType.join(',') : (d?.tagItemType ? String(d.tagItemType) : null),
  };
}

export async function POST(request: Request) {
  try {
    const secret = request.headers.get('x-migrate-secret');
    const expectedSecret = process.env.MIGRATE_HATS_SECRET;
    const bypassAuth = expectedSecret && secret === expectedSecret;

    if (!bypassAuth) {
      const supabase = await createSupabaseClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      const { data: member } = await supabase.from('members').select('role').eq('auth_id', user.id).single();
      const role = (member?.role as string) || '';
      if (!role.toLowerCase().includes('admin')) {
        return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ success: false, error: 'Missing Supabase env vars' }, { status: 500 });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    let items: any[] = [];

    for (const collectionName of COLLECTION_CANDIDATES) {
      try {
        const data = await fetchWixData(collectionName, { limit: 1000 });
        if (data.items && data.items.length > 0) {
          items = data.items;
          console.log(`Migrating ${items.length} items from ${collectionName}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (items.length === 0) {
      return NextResponse.json({ success: true, message: 'No auction items to migrate', migrated: 0 });
    }

    const rows = items.map(mapWixToSupabase);
    const { error } = await adminClient.from('auction_items').upsert(rows, {
      onConflict: 'wix_id',
      ignoreDuplicates: false,
    });

    if (error) {
      console.error('Migrate auction items error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Migrated ${rows.length} auction items to Supabase`,
      migrated: rows.length,
    });
  } catch (err: any) {
    console.error('Migrate auction items error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Migration failed' },
      { status: 500 }
    );
  }
}
