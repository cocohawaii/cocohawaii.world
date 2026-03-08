/**
 * Phase 6: Export ArtCreation from Wix to Supabase auction_config
 *
 * POST /api/admin/migrate-art-config
 * Requires: Admin auth (Supabase session)
 *
 * Run after applying: supabase/PHASE6_ART_CREATION_CONFIG_SQL_EDITOR.sql
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';

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

    let artCreation: any = null;
    try {
      const { getWixClient } = await import('@/app/hooks/useWixClientServer');
      const wixClient = await getWixClient();
      const result = await (wixClient.items.query('ArtCreation') as any).limit(1).find();
      const items = (result?.items || []).map((it: any) => {
        const d = it?.data != null ? it.data : it;
        return { _id: it?._id ?? d?._id, ...d };
      });
      artCreation = items[0] || null;
    } catch (e) {
      console.warn('Could not fetch ArtCreation from Wix:', e);
    }

    const value = artCreation
      ? {
          artBasePrice: parseFloat(String(artCreation.artBasePrice ?? 100)) || 100,
          artPriceIncrease: String(artCreation.artPriceIncrease ?? '0.01'),
          increaseRate: parseInt(String(artCreation.increaseRate ?? 6400), 10) || 6400,
          artPriceIncreasedTotal: parseFloat(String(artCreation.artPriceIncreasedTotal ?? 0)) || 0,
          artPriceFinalTotal: parseFloat(String(artCreation.artPriceFinalTotal ?? 100)) || 100,
        }
      : {
          artBasePrice: 100,
          artPriceIncrease: '0.01',
          increaseRate: 6400,
          artPriceIncreasedTotal: 0,
          artPriceFinalTotal: 100,
        };

    const { error } = await adminClient
      .from('auction_config')
      .upsert({ key: 'art_creation', value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) {
      console.error('Migrate art config error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Migrated ArtCreation config to Supabase',
      migrated: 1,
    });
  } catch (err: any) {
    console.error('Migrate art config error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Migration failed' },
      { status: 500 }
    );
  }
}
