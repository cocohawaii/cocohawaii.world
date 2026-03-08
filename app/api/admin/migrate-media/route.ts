/**
 * Admin API: Migrate media from Wix to Supabase Storage.
 * POST /api/admin/migrate-media
 * Body: { table?: 'hats' | 'raw_hats' | 'auction_items' | 'page_videos' | 'hat_accessories' | 'all', dryRun?: boolean }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  migrateImageToSupabase,
  migrateVideoToSupabase,
  isWixMediaUrl,
  isSupabaseUrl,
} from '@/lib/media-migration';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min for large migrations

async function ensureAdmin() {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: 'Unauthorized', admin: null };
  const { data: member } = await supabase.from('members').select('role').eq('auth_id', user.id).single();
  const role = (member?.role as string) || '';
  if (!role.toLowerCase().includes('admin')) return { error: 'Admin only', admin: null };
  return { admin: createAdminClient() };
}

export async function POST(request: NextRequest) {
  try {
    const { admin, error } = await ensureAdmin();
    if (error) {
      return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
    }

    const body = await request.json().catch(() => ({}));
    const table = body.table || 'hats';
    const dryRun = body.dryRun === true;

    const results: { table: string; migrated: number; skipped: number; errors: string[] } = {
      table,
      migrated: 0,
      skipped: 0,
      errors: [],
    };

    if (table === 'hats' || table === 'all') {
      const { data: hats } = await admin!.from('hats').select('id, wix_id, main_hat_image, top_video_eyes, making_of_product_page, gallery');
      for (const h of hats || []) {
        const prefix = `hats/${h.wix_id}`;
        try {
          if (h.main_hat_image && isWixMediaUrl(h.main_hat_image) && !isSupabaseUrl(h.main_hat_image)) {
            if (!dryRun) {
              const url = await migrateImageToSupabase(h.main_hat_image, `${prefix}/main`);
              if (url) {
                await admin!.from('hats').update({ main_hat_image: url }).eq('id', h.id);
                results.migrated++;
              }
            } else results.migrated++;
          } else if (h.main_hat_image) results.skipped++;

          if (h.top_video_eyes && isWixMediaUrl(h.top_video_eyes) && !isSupabaseUrl(h.top_video_eyes)) {
            if (!dryRun) {
              const url = await migrateVideoToSupabase(h.top_video_eyes, `${prefix}/top-video`);
              if (url) {
                await admin!.from('hats').update({ top_video_eyes: url }).eq('id', h.id);
                results.migrated++;
              }
            } else results.migrated++;
          } else if (h.top_video_eyes) results.skipped++;

          if (h.making_of_product_page && isWixMediaUrl(h.making_of_product_page) && !isSupabaseUrl(h.making_of_product_page)) {
            if (!dryRun) {
              const url = await migrateVideoToSupabase(h.making_of_product_page, `${prefix}/making-of`);
              if (url) {
                await admin!.from('hats').update({ making_of_product_page: url }).eq('id', h.id);
                results.migrated++;
              }
            } else results.migrated++;
          } else if (h.making_of_product_page) results.skipped++;

          const gallery = (h.gallery || []) as Array<{ src?: string } | string>;
          let galleryUpdated = false;
          const newGallery = [];
          for (let i = 0; i < gallery.length; i++) {
            const item = gallery[i];
            const src = typeof item === 'string' ? item : item?.src;
            if (src && isWixMediaUrl(src) && !isSupabaseUrl(src)) {
              if (!dryRun) {
                const url = await migrateImageToSupabase(src, `${prefix}/gallery/${i}`);
                if (url) {
                  newGallery.push(typeof item === 'object' ? { ...item, src: url } : url);
                  galleryUpdated = true;
                  results.migrated++;
                } else newGallery.push(item);
              } else {
                results.migrated++;
                newGallery.push(item);
              }
            } else {
              newGallery.push(item);
            }
          }
          if (galleryUpdated && newGallery.length) {
            await admin!.from('hats').update({ gallery: newGallery }).eq('id', h.id);
          }
        } catch (e: any) {
          results.errors.push(`hat ${h.wix_id}: ${e.message}`);
        }
      }
    }

    if (table === 'raw_hats' || table === 'all') {
      const { data: rows } = await admin!.from('raw_hats').select('id, wix_id, hat_product_image');
      for (const r of rows || []) {
        if (!r.hat_product_image || !isWixMediaUrl(r.hat_product_image) || isSupabaseUrl(r.hat_product_image)) {
          results.skipped++;
          continue;
        }
        try {
          if (!dryRun) {
            const url = await migrateImageToSupabase(r.hat_product_image, `raw_hats/${r.wix_id}/product`);
            if (url) {
              await admin!.from('raw_hats').update({ hat_product_image: url }).eq('id', r.id);
              results.migrated++;
            }
          } else results.migrated++;
        } catch (e: any) {
          results.errors.push(`raw_hat ${r.wix_id}: ${e.message}`);
        }
      }
    }

    if (table === 'auction_items' || table === 'all') {
      const { data: rows } = await admin!.from('auction_items').select('id, wix_id, image_bid_item');
      for (const r of rows || []) {
        if (!r.image_bid_item || !isWixMediaUrl(r.image_bid_item) || isSupabaseUrl(r.image_bid_item)) {
          results.skipped++;
          continue;
        }
        try {
          if (!dryRun) {
            const url = await migrateImageToSupabase(r.image_bid_item, `auction_items/${r.wix_id}/main`);
            if (url) {
              await admin!.from('auction_items').update({ image_bid_item: url }).eq('id', r.id);
              results.migrated++;
            }
          } else results.migrated++;
        } catch (e: any) {
          results.errors.push(`auction_item ${r.wix_id}: ${e.message}`);
        }
      }
    }

    if (table === 'page_videos' || table === 'all') {
      const { data: rows } = await admin!.from('page_videos').select('id, tag, video_url');
      for (const r of rows || []) {
        if (!r.video_url || !isWixMediaUrl(r.video_url) || isSupabaseUrl(r.video_url)) {
          results.skipped++;
          continue;
        }
        try {
          if (!dryRun) {
            const url = await migrateVideoToSupabase(r.video_url, `page_videos/${r.tag}`);
            if (url) {
              await admin!.from('page_videos').update({ video_url: url }).eq('id', r.id);
              results.migrated++;
            }
          } else results.migrated++;
        } catch (e: any) {
          results.errors.push(`page_video ${r.tag}: ${e.message}`);
        }
      }
    }

    if (table === 'hat_accessories' || table === 'all') {
      const { data: rows } = await admin!.from('hat_accessories').select('id, wix_id, image_url');
      for (const r of rows || []) {
        if (!r.image_url || !isWixMediaUrl(r.image_url) || isSupabaseUrl(r.image_url)) {
          results.skipped++;
          continue;
        }
        try {
          if (!dryRun) {
            const url = await migrateImageToSupabase(r.image_url, `hat_accessories/${r.wix_id}/image`);
            if (url) {
              await admin!.from('hat_accessories').update({ image_url: url }).eq('id', r.id);
              results.migrated++;
            }
          } else results.migrated++;
        } catch (e: any) {
          results.errors.push(`hat_accessory ${r.wix_id}: ${e.message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      results,
    });
  } catch (err: any) {
    console.error('migrate-media error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
