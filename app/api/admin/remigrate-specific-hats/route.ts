/**
 * POST /api/admin/remigrate-specific-hats
 * Re-migrates main + gallery for specific hats from Wix CMS (fresh URLs).
 * Body: { hats: [{ title: string, fields: ('main_hat_image' | 'gallery')[] }] }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getWixClient } from '@/app/hooks/useWixClientServer';
import { migrateImageToSupabase } from '@/lib/media-migration';
import { convertWixImageUrl } from '@/lib/wix-utils';

export const dynamic = 'force-dynamic';

async function ensureAdmin() {
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
    if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });

    const body = await request.json();
    const hats = body.hats as Array<{ title: string; fields: string[] }>;
    if (!hats?.length) return NextResponse.json({ error: 'Missing hats array' }, { status: 400 });

    const wixClient = await getWixClient();
    const { items: wixHats } = await wixClient.items
      .query('CocoHawaiiExoticHats')
      .limit(500)
      .find();

    const results: { title: string; migrated: string[]; errors: string[] }[] = [];

    for (const spec of hats) {
      const wixHat = (wixHats || []).find((h: any) => {
        const t = (h?.data?.title || h?.title || '').trim();
        return t.toLowerCase() === spec.title.toLowerCase();
      });
      if (!wixHat) {
        results.push({ title: spec.title, migrated: [], errors: ['Hat not found in Wix'] });
        continue;
      }

      const d = wixHat?.data ?? wixHat;
      const wixId = String(wixHat._id ?? d._id ?? '');
      const prefix = `hats/${wixId}`;
      const migrated: string[] = [];
      const errors: string[] = [];

      const { data: supabaseHat } = await admin!.from('hats').select('id').eq('wix_id', wixId).single();
      if (!supabaseHat) {
        results.push({ title: spec.title, migrated: [], errors: ['Hat not found in Supabase'] });
        continue;
      }

      if (spec.fields.includes('main_hat_image') && d.mainHatImage) {
        try {
          const url = await migrateImageToSupabase(d.mainHatImage, `${prefix}/main`);
          if (url) {
            await admin!.from('hats').update({ main_hat_image: url }).eq('id', supabaseHat.id);
            migrated.push('main_hat_image');
          }
        } catch (e: any) {
          errors.push(`main_hat_image: ${e.message}`);
        }
      }

      if (spec.fields.includes('gallery') && Array.isArray(d.gallery)) {
        const gallery = d.gallery as Array<{ src?: string } | string>;
        const newGallery: typeof gallery = [];
        let hasChange = false;
        for (let i = 0; i < gallery.length; i++) {
          const item = gallery[i];
          const src = typeof item === 'string' ? item : item?.src;
          if (src && (src.startsWith('wix:image') || src.includes('static.wixstatic.com'))) {
            try {
              const resolved = convertWixImageUrl(src) || src;
              if (resolved.startsWith('http')) {
                const url = await migrateImageToSupabase(src, `${prefix}/gallery/${i}`);
                if (url) {
                  newGallery.push(typeof item === 'object' ? { ...item, src: url } : url);
                  migrated.push(`gallery[${i}]`);
                  hasChange = true;
                  continue;
                }
              }
            } catch (e: any) {
              errors.push(`gallery[${i}]: ${e.message}`);
            }
          }
          newGallery.push(item);
        }
        if (hasChange) {
          await admin!.from('hats').update({ gallery: newGallery }).eq('id', supabaseHat.id);
        }
      }

      results.push({ title: spec.title, migrated, errors });
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error('remigrate-specific-hats error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
