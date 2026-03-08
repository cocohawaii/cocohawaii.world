/**
 * POST /api/admin/migrate-media-update
 * Updates a hat's media field after client-side upload.
 * Body: { hatId: number, field: string, newUrl: string, galleryIndex?: number }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

export async function POST(request: NextRequest) {
  try {
    const { admin, error } = await ensureAdmin();
    if (error) {
      return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
    }

    const body = await request.json();
    const { hatId, field, newUrl, galleryIndex } = body;
    if (!hatId || !field || !newUrl) {
      return NextResponse.json({ error: 'Missing hatId, field, or newUrl' }, { status: 400 });
    }

    if (field === 'gallery' && galleryIndex !== undefined) {
      const { data: hat } = await admin!.from('hats').select('gallery').eq('id', hatId).single();
      const gallery = (hat?.gallery || []) as Array<{ src?: string } | string>;
      if (galleryIndex >= 0 && galleryIndex < gallery.length) {
        const item = gallery[galleryIndex];
        const updated = typeof item === 'object' ? { ...item, src: newUrl } : newUrl;
        gallery[galleryIndex] = updated;
        await admin!.from('hats').update({ gallery }).eq('id', hatId);
      }
    } else if (['main_hat_image', 'top_video_eyes', 'making_of_product_page'].includes(field)) {
      await admin!.from('hats').update({ [field]: newUrl }).eq('id', hatId);
    } else {
      return NextResponse.json({ error: 'Invalid field' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('migrate-media-update error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
