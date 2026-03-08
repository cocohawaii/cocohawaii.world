import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BUCKET = 'videos';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: member } = await admin.from('members').select('role').eq('auth_id', user.id).single();
    if (!member || !String(member.role).toLowerCase().includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Invalid content type', message: `Expected multipart/form-data, got ${contentType}` }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileName = file.name;
    const ext = fileName.split('.').pop() || 'mp4';
    const path = `hats/uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error } = await admin.storage.from(BUCKET).upload(path, buffer, {
      contentType: file.type || 'video/mp4',
      upsert: true,
    });

    if (error) {
      console.error('Supabase storage upload error:', error);
      return NextResponse.json({
        error: 'Upload failed',
        message: error.message,
        hint: 'Ensure "videos" bucket exists in Supabase Dashboard → Storage (run PHASE9_STORAGE_MEDIA.sql)',
      }, { status: 500 });
    }

    const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileId: path,
      fileName,
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: err?.message || 'Upload failed' }, { status: 500 });
  }
}
