/**
 * GET /api/admin/migrate-media-proxy?url=...
 * Proxies Wix CDN requests server-side to bypass 403 (Wix blocks direct browser fetch).
 * Returns the image/video bytes.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': process.env.WIX_REFERER_URL || 'https://www.wix.com/',
  'Origin': process.env.WIX_REFERER_URL || 'https://www.wix.com/',
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: member } = await supabase.from('members').select('role').eq('auth_id', user.id).single();
    const role = (member?.role as string) || '';
    if (!role.toLowerCase().includes('admin')) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    const url = request.nextUrl.searchParams.get('url');
    if (!url || !url.startsWith('http')) return NextResponse.json({ error: 'Invalid url param' }, { status: 400 });

    const res = await fetch(url, { headers: BROWSER_HEADERS });
    if (!res.ok) return NextResponse.json({ error: `Wix returned ${res.status}` }, { status: res.status });

    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const buffer = Buffer.from(await res.arrayBuffer());
    return new NextResponse(buffer, {
      headers: { 'Content-Type': contentType },
    });
  } catch (err: unknown) {
    console.error('migrate-media-proxy error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Proxy failed' }, { status: 500 });
  }
}
