/**
 * Phase 7: Export ArtAllBids from Wix to Supabase legacy_auction_bids
 *
 * POST /api/admin/migrate-legacy-bids
 * Requires: Admin auth (Supabase session)
 *
 * Run after applying: supabase/PHASE7_LEGACY_AUCTION_BIDS_SQL_EDITOR.sql
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { fetchWixData } from '@/lib/wix';

const COLLECTION_CANDIDATES = ['ArtAllBids', 'Art All Bids'];

function parseDate(v: unknown): string {
  if (v == null) return new Date().toISOString();
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return new Date(v).toISOString();
  if (typeof v === 'object' && v !== null && '$date' in v) {
    const d = (v as { $date?: string }).$date;
    return typeof d === 'string' ? d : new Date().toISOString();
  }
  return new Date(String(v)).toISOString();
}

function mapWixToSupabase(item: any): Record<string, unknown> {
  const d = item?.data ?? item;
  return {
    wix_id: item?._id ?? d?._id ?? null,
    item_id: String(d?.itemId ?? d?.item_id ?? ''),
    item_name: d?.itemName ?? d?.item_name ?? null,
    item_type: d?.itemType ?? d?.item_type ?? null,
    item_image: d?.itemImage ?? d?.item_image ?? null,
    bid_amount: parseFloat(String(d?.bidAmount ?? 0)) || 0,
    bid_price: parseFloat(String(d?.bidPrice ?? 0)) || 0,
    user_bid_count: parseInt(String(d?.userBidCount ?? 1), 10) || 1,
    user_bid_amount: parseFloat(String(d?.userBidAmount ?? 0)) || 0,
    user_bid_price_amount: parseFloat(String(d?.userBidPriceAmount ?? 0)) || 0,
    bid_date: parseDate(d?.bidDate ?? d?.bid_date),
    member_email: d?.memberEmail ?? d?.member_email ?? null,
    member_username: d?.memberUsername ?? d?.member_username ?? null,
    member_name: d?.memberName ?? d?.member_name ?? null,
    legacy_member_id: d?.memberId ?? d?.member_id ?? null,
    total_countdown_left: d?.totalCountdownLeft ?? null,
    art_price_final_total: d?.artPriceFinalTotal ?? null,
    item_winners: d?.itemWinners ?? null,
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
        const data = await fetchWixData(collectionName, { limit: 5000 });
        if (data.items && data.items.length > 0) {
          items = data.items;
          console.log(`Migrating ${items.length} legacy bids from ${collectionName}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (items.length === 0) {
      return NextResponse.json({ success: true, message: 'No legacy bids to migrate', migrated: 0 });
    }

    const rows = items.map(mapWixToSupabase);
    const { error } = await adminClient.from('legacy_auction_bids').insert(rows);

    if (error) {
      console.error('Migrate legacy bids error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Migrated ${rows.length} legacy bids to Supabase`,
      migrated: rows.length,
    });
  } catch (err: any) {
    console.error('Migrate legacy bids error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Migration failed' },
      { status: 500 }
    );
  }
}
