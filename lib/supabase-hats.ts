/**
 * Supabase-backed hats (Phase 5: replaces Wix CocoHawaiiExoticHats)
 */
import { createClient } from '@/lib/supabase/server';
import { convertWixImageUrl, convertWixVideoUrl } from '@/lib/wix-utils';
import type { Hat, Collection } from '@/lib/wix-types';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function mapRowToHat(row: any, rawVideoUrls: boolean): Hat {
  const title = row.title || '';
  const gallery = row.gallery || [];
  const galleryMapped = rawVideoUrls
    ? gallery
    : gallery.map((img: any) => ({
        src: convertWixImageUrl(typeof img === 'string' ? img : img?.src) || '',
        alt: typeof img === 'string' ? '' : (img?.alt || ''),
      }));
  return {
    _id: row.wix_id,
    title: title || 'Untitled',
    hatSubtitle: row.hat_subtitle ?? undefined,
    hatDescription: row.hat_description ?? undefined,
    price: Number(row.price) || 0,
    discountedPrice: row.discounted_price != null ? Number(row.discounted_price) : undefined,
    mainHatImage: convertWixImageUrl(row.main_hat_image) ?? row.main_hat_image ?? undefined,
    topVideoEyes: rawVideoUrls
      ? (row.top_video_eyes ?? '')
      : (convertWixVideoUrl(row.top_video_eyes) || row.top_video_eyes || ''),
    makingOfProductPage: rawVideoUrls
      ? (row.making_of_product_page ?? '')
      : (convertWixVideoUrl(row.making_of_product_page) || row.making_of_product_page || ''),
    gallery: galleryMapped,
    hatSize: row.hat_size ?? undefined,
    collection: row.collection ?? undefined,
    slug: row.slug || generateSlug(title),
    isActive: row.is_active !== false,
    isSold: Boolean(row.is_sold),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
  };
}

export type HatsSortBy = 'title' | 'created_at_desc' | 'created_at_asc' | 'display_order';

export async function getHatsFromSupabase(
  collectionId?: string,
  options?: { rawVideoUrls?: boolean; activeOnly?: boolean; sortBy?: HatsSortBy }
): Promise<Hat[]> {
  const rawVideoUrls = options?.rawVideoUrls === true;
  const activeOnly = options?.activeOnly === true;
  const sortBy = options?.sortBy ?? 'created_at_desc';
  const supabase = await createClient();
  let query = supabase.from('hats').select('*');
  if (activeOnly) {
    query = query.eq('is_active', true);
  }
  if (collectionId) {
    query = query.eq('collection', collectionId);
  }
  if (sortBy === 'title') {
    query = query.order('title');
  } else if (sortBy === 'created_at_asc') {
    query = query.order('created_at', { ascending: true });
  } else if (sortBy === 'display_order') {
    query = query.order('display_order', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }
  const { data: rows, error } = await query.limit(100);
  if (error) {
    console.error('getHatsFromSupabase error:', error);
    return [];
  }
  return (rows || []).map((r) => mapRowToHat(r, rawVideoUrls));
}

export async function getHatFromSupabase(
  idOrSlug: string,
  options?: { rawVideoUrls?: boolean }
): Promise<Hat | null> {
  const rawVideoUrls = options?.rawVideoUrls === true;
  const supabase = await createClient();
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  let row: any = null;
  if (isUUID) {
    const { data } = await supabase.from('hats').select('*').eq('wix_id', idOrSlug).maybeSingle();
    row = data;
  }
  if (!row) {
    const { data } = await supabase.from('hats').select('*').eq('slug', idOrSlug).maybeSingle();
    row = data;
  }
  if (!row) {
    const norm = idOrSlug.toLowerCase().trim().replace(/\s+/g, '-');
    const { data: rows } = await supabase.from('hats').select('*').limit(100);
    row = (rows || []).find(
      (r) =>
        (r.slug || '').toLowerCase() === norm ||
        generateSlug(r.title || '').toLowerCase() === norm
    );
  }
  if (!row) return null;
  return mapRowToHat(row, rawVideoUrls);
}

/** Derive collections from unique collection values in hats */
export async function getCollectionsFromSupabase(): Promise<Collection[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from('hats')
    .select('collection, main_hat_image')
    .eq('is_active', true)
    .not('collection', 'is', null)
    .order('collection');
  if (error || !rows?.length) return [];
  const seen = new Set<string>();
  const collections: Collection[] = [];
  for (const r of rows) {
    const col = String(r.collection || '').trim();
    if (!col || seen.has(col)) continue;
    seen.add(col);
    collections.push({
      _id: col,
      name: col,
      slug: col.toLowerCase().replace(/\s+/g, '-'),
      image: convertWixImageUrl(r.main_hat_image) || r.main_hat_image,
    });
  }
  return collections;
}

/** Get a single collection by id (collection value) */
export async function getCollectionFromSupabase(idOrSlug: string): Promise<Collection | null> {
  const collections = await getCollectionsFromSupabase();
  const norm = idOrSlug.toLowerCase().trim();
  return (
    collections.find(
      (c) =>
        c._id === idOrSlug ||
        c._id.toLowerCase() === norm ||
        (c.slug || '').toLowerCase() === norm
    ) ?? null
  );
}
