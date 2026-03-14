/**
 * GET /api/admin/migrate-media-list?table=hats
 * Returns list of Wix media URLs for client-side migration (browser fetch bypasses Wix 403).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { convertWixImageUrl, convertWixVideoUrl } from '@/lib/wix-utils';
import { isWixMediaUrl, isSupabaseUrl } from '@/lib/media-migration';

export const dynamic = 'force-dynamic';

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

function resolveImageUrl(wixUrl: string): string | null {
  const resolved = convertWixImageUrl(wixUrl) || wixUrl;
  return resolved.startsWith('http') ? resolved : null;
}

function resolveVideoUrl(wixUrl: string): string | null {
  const resolved = convertWixVideoUrl(wixUrl) || wixUrl;
  return resolved.startsWith('http') ? resolved : null;
}

export async function GET(request: NextRequest) {
  try {
    const { admin, error } = await ensureAdmin();
    if (error) {
      return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
    }

    const table = request.nextUrl.searchParams.get('table') || 'hats';
    const items: Array<{
      hatId: number;
      wixId: string;
      field: string;
      url: string;
      storagePath: string;
      isVideo: boolean;
      galleryIndex?: number;
    }> = [];

    if (table === 'hats') {
      const { data: hats } = await admin!.from('hats').select('id, wix_id, main_hat_image, top_video_eyes, making_of_product_page, gallery');
      const imageItems: typeof items = [];
      const videoItems: typeof items = [];
      for (const h of hats || []) {
        const prefix = `hats/${h.wix_id}`;
        if (h.main_hat_image && isWixMediaUrl(h.main_hat_image) && !isSupabaseUrl(h.main_hat_image)) {
          const url = resolveImageUrl(h.main_hat_image);
          if (url) imageItems.push({ hatId: h.id, wixId: h.wix_id, field: 'main_hat_image', url, storagePath: `${prefix}/main`, isVideo: false });
        }
        const gallery = (h.gallery || []) as Array<{ src?: string } | string>;
        for (let i = 0; i < gallery.length; i++) {
          const item = gallery[i];
          const src = typeof item === 'string' ? item : item?.src;
          if (src && isWixMediaUrl(src) && !isSupabaseUrl(src)) {
            const url = resolveImageUrl(src);
            if (url) imageItems.push({ hatId: h.id, wixId: h.wix_id, field: 'gallery', url, storagePath: `${prefix}/gallery/${i}`, isVideo: false, galleryIndex: i });
          }
        }
        if (h.top_video_eyes && isWixMediaUrl(h.top_video_eyes) && !isSupabaseUrl(h.top_video_eyes)) {
          const url = resolveVideoUrl(h.top_video_eyes);
          if (url) videoItems.push({ hatId: h.id, wixId: h.wix_id, field: 'top_video_eyes', url, storagePath: `${prefix}/top-video`, isVideo: true });
        }
        if (h.making_of_product_page && isWixMediaUrl(h.making_of_product_page) && !isSupabaseUrl(h.making_of_product_page)) {
          const url = resolveVideoUrl(h.making_of_product_page);
          if (url) videoItems.push({ hatId: h.id, wixId: h.wix_id, field: 'making_of_product_page', url, storagePath: `${prefix}/making-of`, isVideo: true });
        }
      }
      items.push(...imageItems, ...videoItems);
    }

    return NextResponse.json({ success: true, items });
  } catch (err: any) {
    console.error('migrate-media-list error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
