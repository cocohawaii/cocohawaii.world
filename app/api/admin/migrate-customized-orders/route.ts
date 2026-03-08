/**
 * Phase 4: Export CustomizedHatOrders from Wix to Supabase
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
    const bypassAuth = process.env.MIGRATE_HATS_SECRET && secret === process.env.MIGRATE_HATS_SECRET;
    if (!bypassAuth) {
      const supabase = await createSupabaseClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      const { data: m } = await supabase.from('members').select('role').eq('auth_id', user.id).single();
      if (!(m?.role as string)?.toLowerCase().includes('admin')) return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!url || !key) return NextResponse.json({ success: false, error: 'Missing Supabase env' }, { status: 500 });
    const admin = createClient(url, key);
    const wix = await getWixClient();
    const { items } = await wix.items.query('CustomizedHatOrders').limit(1000).find();
    const rows = (items || []).map((it: any) => {
      const d = it?.data ?? it;
      const hf = d.hatForm;
      const hatForm = Array.isArray(hf) ? hf : hf ? [hf] : [];
      return {
        wix_id: String(it._id ?? d._id ?? ''),
        group_order_id: d.groupOrderId ?? 'ungrouped',
        hat_form: hatForm,
        hat_color_name: d.hatColorName ?? '',
        hat_product_image: d.hatProductImage ?? '',
        raw_hat_price: parsePrice(d.rawHatPrice),
        raw_hat_id: d.rawHatId ?? '',
        art: d.art ?? '',
        art_colors: d.artColors ?? '',
        art_description: d.artDescription ?? '',
        precious_stones: d.preciousStones ?? '',
        precious_stone_type: d.preciousStoneType ?? '',
        jewelry: d.jewelry ?? '',
        jewelry_type: d.jewelryType ?? '',
        fabric: d.fabric ?? '',
        notes: d.notes ?? '',
        birth_date: d.birthDate ?? '',
        client_description: d.clientDescription ?? '',
        indv_raw_hat_n_accessory_total_live_price: parsePrice(d.IndvRawHatNAccessoryTotalLivePrice),
        email: d.email ?? '',
        name: d.name ?? '',
        mobile: d.mobile ?? '',
        phone_code: d.phoneCode ?? '',
        address: d.address ?? '',
        shipping_price: parsePrice(d.shippingPrice),
        shipping_type: d.shippingType ?? '',
        final_total_price: parsePrice(d.finalTotalPrice),
        payment_method: d.paymentMethod ?? '',
        order_paid: Boolean(d.orderPaid),
        order_created_on: parseDate(d.orderCreatedOn),
      };
    });
    if (rows.length === 0) return NextResponse.json({ success: true, migrated: 0 });
    const { error } = await admin.from('customized_hat_orders').upsert(rows, { onConflict: 'wix_id' });
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, migrated: rows.length });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed' }, { status: 500 });
  }
}
