/**
 * Phase 2: Export hatOrders from Wix to Supabase
 * POST /api/admin/migrate-hat-orders
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getWixClient } from '@/app/hooks/useWixClientServer';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';

function parsePrice(v: any): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && v !== null) return (v as any).value ?? (v as any).amount ?? 0;
  return parseFloat(String(v)) || 0;
}

function parseDate(v: any): string | null {
  if (!v) return null;
  if (typeof v === 'object' && v.formatted) return v.formatted;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'string') return v;
  return null;
}

export async function POST(request: Request) {
  try {
    const secret = request.headers.get('x-migrate-secret');
    const expectedSecret = process.env.MIGRATE_HATS_SECRET;
    const bypassAuth = expectedSecret && secret === expectedSecret;

    if (!bypassAuth) {
      const supabase = await createSupabaseClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      const { data: member } = await supabase.from('members').select('role').eq('auth_id', user.id).single();
      const role = (member?.role as string) || '';
      if (!role.toLowerCase().includes('admin')) return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!supabaseUrl || !supabaseServiceKey) return NextResponse.json({ success: false, error: 'Missing Supabase env' }, { status: 500 });

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const wixClient = await getWixClient();

    const { items: orders } = await wixClient.items
      .query('hatOrders')
      .descending('hatOrderCreatedOn')
      .limit(1000)
      .find();

    const allOrders = orders || [];
    const rows = allOrders.map((order: any) => {
      const d = order.data || order;
      return {
        wix_id: String(order._id ?? d._id ?? ''),
        order_id: String(d.hatOrderID ?? ''),
        customer_name: String(d.hatorderName ?? ''),
        customer_email: String(d.hatorderEmail ?? ''),
        customer_mobile: String(d.hatorderMobile ?? ''),
        customer_address: String(d.orderAddress ?? ''),
        shipping_city: String(d.shippingCity ?? ''),
        shipping_postal_code: String(d.shippingPostalCode ?? ''),
        shipping_country: String(d.shippingCountry ?? ''),
        hat_title: String(d.hatOrdertitle ?? '').trim() || 'Untitled',
        hat_subtitle: String(d.hatOrderSubtitle ?? ''),
        hat_image: '', // Will be joined from hats table later
        hat_price: parsePrice(d.hatOrderPrice),
        shipping_cost: parsePrice(d.shippingCost),
        total_price: parsePrice(d.totalFinalCost || d.hatOrderPrice),
        shipping_option: String(d.shippingOption ?? ''),
        custom_ask: String(d.hatorderCustomAsk ?? ''),
        pr_referral_id: String(d.prReferralId ?? ''),
        order_created_on: parseDate(d.hatOrderCreatedOn),
      };
    });

    if (rows.length === 0) {
      return NextResponse.json({ success: true, message: 'No orders to migrate', migrated: 0 });
    }

    const { error } = await adminClient.from('hat_orders').upsert(rows, { onConflict: 'wix_id', ignoreDuplicates: false });
    if (error) {
      console.error('Migrate hat orders error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Migrated ${rows.length} hat orders`, migrated: rows.length });
  } catch (err: any) {
    console.error('Migrate hat orders error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Migration failed' }, { status: 500 });
  }
}
