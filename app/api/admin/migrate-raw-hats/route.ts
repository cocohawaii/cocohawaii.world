/**
 * Phase 3: Export rawHatCollection from Wix to Supabase + migrate images to Supabase Storage
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getWixClient } from '@/app/hooks/useWixClientServer';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { migrateImageToSupabase } from '@/lib/media-migration';

function isWixImageUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  return url.startsWith('wix:image') || url.includes('static.wixstatic.com');
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
    const { items } = await wix.items.query('rawHatCollection').limit(1000).find();
    const rows = (items || []).map((it: any) => {
      const d = it?.data ?? it;
      const hatColor = d.hatColor;
      let arr: string[] = [];
      if (Array.isArray(hatColor)) arr = hatColor.filter((c: any) => c && typeof c === 'string');
      else if (hatColor && typeof hatColor === 'string') arr = [hatColor.startsWith('#') ? hatColor : `#${hatColor}`];
      return {
        wix_id: String(it._id ?? d._id ?? ''),
        hat_form: Array.isArray(d.hatForm) ? d.hatForm[0] : d.hatForm,
        hat_color_name: d.hatColorName ?? '',
        hat_product_name: d.hatProductName ?? '',
        hat_product_image: d.hatProductImage ?? '',
        hat_color: arr,
        hat_color_hex: arr[0] ?? '',
        raw_hat_price: typeof d.rawHatPrice === 'number' ? d.rawHatPrice : parseFloat(String(d.rawHatPrice || 0)) || 0,
        raw_hat_id: d.rawHatId ?? it._id ?? d._id,
      };
    });
    if (rows.length === 0) return NextResponse.json({ success: true, migrated: 0, imagesMigrated: 0 });
    const { error } = await admin.from('raw_hats').upsert(rows, { onConflict: 'wix_id' });
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    let imagesMigrated = 0;
    for (const row of rows) {
      if (row.hat_product_image && isWixImageUrl(row.hat_product_image)) {
        try {
          const newUrl = await migrateImageToSupabase(row.hat_product_image, `raw_hats/${row.wix_id}/product`);
          if (newUrl) {
            const { data: existing } = await admin.from('raw_hats').select('id').eq('wix_id', row.wix_id).single();
            if (existing) {
              await admin.from('raw_hats').update({ hat_product_image: newUrl }).eq('id', existing.id);
              imagesMigrated++;
            }
          }
        } catch (e) {
          console.warn(`Failed to migrate image for raw hat ${row.wix_id}:`, e);
        }
      }
    }

    return NextResponse.json({ success: true, migrated: rows.length, imagesMigrated });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed' }, { status: 500 });
  }
}
