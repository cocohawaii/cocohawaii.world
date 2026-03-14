/**
 * POST /api/admin/migrate-single-image
 * Migrates one image from Wix to Supabase (server-side, bypasses 403).
 * Body: { wixUrl: string, wixId: string, field: 'main_hat_image' | 'gallery', galleryIndex?: number }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { convertWixImageUrl } from '@/lib/wix-utils';

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': process.env.WIX_REFERER_URL || 'https://www.wix.com/',
  'Origin': process.env.WIX_REFERER_URL || 'https://www.wix.com/',
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: member } = await supabase.from('members').select('role').eq('auth_id', user.id).single();
    const role = (member?.role as string) || '';
    if (!role.toLowerCase().includes('admin')) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    const body = await request.json();
    const { wixUrl, wixId, field, galleryIndex } = body;
    if (!wixUrl || !wixId || !field) {
      return NextResponse.json({ error: 'Missing wixUrl, wixId, or field' }, { status: 400 });
    }

    const resolved = convertWixImageUrl(wixUrl) || wixUrl;
    if (!resolved.startsWith('http')) return NextResponse.json({ error: 'Invalid Wix URL' }, { status: 400 });

    const admin = createAdminClient();
    const { data: hat } = await admin.from('hats').select('id').eq('wix_id', wixId).single();
    if (!hat) return NextResponse.json({ error: `Hat not found: ${wixId}` }, { status: 404 });

    const res = await fetch(resolved, { headers: BROWSER_HEADERS });
    if (!res.ok) return NextResponse.json({ error: `Wix returned ${res.status}` }, { status: res.status });

    const ext = resolved.match(/\.(jpg|jpeg|png|webp|gif)$/i)?.[1]?.toLowerCase() || 'png';
    const prefix = `hats/${wixId}`;
    const storagePath = field === 'main_hat_image' ? `${prefix}/main.${ext}` : `${prefix}/gallery/${galleryIndex ?? 0}.${ext}`;

    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
    const { error: upErr } = await admin.storage.from('media').upload(storagePath, buffer, { contentType, upsert: true });
    if (upErr) return NextResponse.json({ error: `Upload failed: ${upErr.message}` }, { status: 500 });

    const { data: pub } = admin.storage.from('media').getPublicUrl(storagePath);
    const newUrl = pub.publicUrl;

    if (field === 'gallery' && galleryIndex !== undefined) {
      const { data: h } = await admin.from('hats').select('gallery').eq('id', hat.id).single();
      const gallery = (h?.gallery || []) as Array<{ src?: string } | string>;
      if (galleryIndex >= 0 && galleryIndex < gallery.length) {
        const item = gallery[galleryIndex];
        gallery[galleryIndex] = typeof item === 'object' ? { ...item, src: newUrl } : newUrl;
        await admin.from('hats').update({ gallery }).eq('id', hat.id);
      }
    } else if (field === 'main_hat_image') {
      await admin.from('hats').update({ main_hat_image: newUrl }).eq('id', hat.id);
    } else {
      return NextResponse.json({ error: 'Invalid field' }, { status: 400 });
    }

    return NextResponse.json({ success: true, newUrl });
  } catch (err: unknown) {
    console.error('migrate-single-image error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Migration failed' }, { status: 500 });
  }
}
