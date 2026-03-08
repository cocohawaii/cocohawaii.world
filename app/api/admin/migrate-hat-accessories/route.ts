/**
 * Phase 3: Export HatAccessories from Wix to Supabase
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getWixClient } from '@/app/hooks/useWixClientServer';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';

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
    const { items } = await wix.items.query('HatAccessories').limit(1000).find();
    const rows = (items || []).map((it: any) => {
      const d = it?.data ?? it;
      const tags = d.accessoryTags;
      const tagArr = Array.isArray(tags) ? tags : tags ? [tags] : [];
      return {
        wix_id: String(it._id ?? d._id ?? ''),
        accessory_type: d.accessoryType ?? '',
        accessory_tags: tagArr,
        title: d.title ?? '',
        image_url: d.imageUrl ?? d.mainImage ?? '',
        price: typeof d.price === 'number' ? d.price : parseFloat(String(d.price || 0)) || 0,
      };
    });
    if (rows.length === 0) return NextResponse.json({ success: true, migrated: 0 });
    const { error } = await admin.from('hat_accessories').upsert(rows, { onConflict: 'wix_id' });
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, migrated: rows.length });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed' }, { status: 500 });
  }
}
