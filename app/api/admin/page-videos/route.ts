/**
 * GET /api/admin/page-videos - List page videos (admin only)
 * PATCH /api/admin/page-videos - Update page video by tag (admin only)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

export async function GET() {
  try {
    const { admin, error } = await ensureAdmin();
    if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });

    const { data: rows, error: dbError } = await admin!.from('page_videos')
      .select('id, tag, video_url')
      .order('tag');

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

    const videos = (rows || []).map((r: { id: string; tag: string; video_url: string }) => ({
      id: r.id,
      tag: r.tag,
      videoUrl: r.video_url,
    }));

    return NextResponse.json({ success: true, videos });
  } catch (err: any) {
    console.error('page-videos GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { admin, error } = await ensureAdmin();
    if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });

    const body = await request.json();
    const { tag, videoUrl } = body;
    if (!tag?.trim()) return NextResponse.json({ error: 'tag required' }, { status: 400 });

    const { data: existing } = await admin!.from('page_videos').select('id').eq('tag', tag.trim()).single();

    if (existing) {
      const { error: updateErr } = await admin!.from('page_videos')
        .update({ video_url: videoUrl?.trim() || '' })
        .eq('tag', tag.trim());
      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
    } else {
      const { error: insertErr } = await admin!.from('page_videos')
        .insert({ tag: tag.trim(), video_url: videoUrl?.trim() || '' });
      if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('page-videos PATCH error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
