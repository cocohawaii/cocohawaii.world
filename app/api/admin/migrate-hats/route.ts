/**
 * Phase 1: Export CocoHawaiiExoticHats from Wix to Supabase
 *
 * POST /api/admin/migrate-hats
 * Requires: Admin auth (Supabase session)
 *
 * Run after applying migration: supabase/PHASE1_HATS_SQL_EDITOR.sql
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getWixClient } from '@/app/hooks/useWixClientServer';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function mapWixHatToSupabase(item: any): Record<string, unknown> {
  const d = item?.data ?? item;
  const title = d.title || d.hatTitle || '';
  const slug = d.slug || generateSlug(title);
  return {
    wix_id: String(item._id ?? d._id ?? ''),
    title: String(title).trim() || 'Untitled',
    hat_subtitle: d.hatSubtitle ? String(d.hatSubtitle) : null,
    hat_description: d.hatDescription ? String(d.hatDescription) : null,
    price: typeof d.price === 'number' ? d.price : parseFloat(String(d.price || 0)) || 0,
    discounted_price:
      d.discountedPrice != null
        ? typeof d.discountedPrice === 'number'
          ? d.discountedPrice
          : parseFloat(String(d.discountedPrice)) || null
        : null,
    main_hat_image: d.mainHatImage ? String(d.mainHatImage) : null,
    top_video_eyes: d.topVideoEyes ? String(d.topVideoEyes) : null,
    making_of_product_page: d.makingOfProductPage ? String(d.makingOfProductPage) : null,
    gallery: Array.isArray(d.gallery) ? d.gallery : [],
    hat_size: d.hatSize ? String(d.hatSize) : null,
    collection: d.collection ? String(d.collection) : null,
    color: d.color ? String(d.color) : null,
    slug: slug || null,
    is_active: d.isActive !== false,
    extra_data: {},
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
    const wixClient = await getWixClient();

    const { items: wixHats } = await wixClient.items
      .query('CocoHawaiiExoticHats')
      .limit(500)
      .find();

    const hats = wixHats || [];
    const rows = hats.map(mapWixHatToSupabase);

    if (rows.length === 0) {
      return NextResponse.json({ success: true, message: 'No hats to migrate', migrated: 0 });
    }

    const { error } = await adminClient.from('hats').upsert(rows, {
      onConflict: 'wix_id',
      ignoreDuplicates: false,
    });

    if (error) {
      console.error('Migrate hats error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Migrated ${rows.length} hats to Supabase`,
      migrated: rows.length,
    });
  } catch (err: any) {
    console.error('Migrate hats error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Migration failed' },
      { status: 500 }
    );
  }
}
