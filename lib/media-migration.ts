/**
 * Media migration: download from Wix CDN, upload to Supabase Storage.
 * Used by admin migration API.
 */
import { createAdminClient } from '@/lib/supabase/admin';
import { convertWixImageUrl, convertWixVideoUrl } from '@/lib/wix-utils';

const MEDIA_BUCKET = 'media';
const VIDEOS_BUCKET = 'videos';

function getResolvedImageUrl(wixUrl: string | null | undefined): string | null {
  if (!wixUrl?.trim()) return null;
  const resolved = convertWixImageUrl(wixUrl) || wixUrl;
  if (resolved.startsWith('http')) return resolved;
  return null;
}

function getResolvedVideoUrl(wixUrl: string | null | undefined): string | null {
  if (!wixUrl?.trim()) return null;
  const resolved = convertWixVideoUrl(wixUrl) || wixUrl;
  if (resolved.startsWith('http')) return resolved;
  return null;
}

// Wix CDN blocks requests without browser-like headers (403). Use real browser headers.
const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': process.env.WIX_REFERER_URL || 'https://www.wix.com/',
  'Origin': process.env.WIX_REFERER_URL || 'https://www.wix.com/',
};

async function downloadFile(url: string): Promise<Buffer> {
  const res = await fetch(url, { headers: BROWSER_HEADERS });
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

function getExtensionFromUrl(url: string, defaultExt: string): string {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.(jpg|jpeg|png|webp|gif|svg|mp4|webm|mov)$/i);
    return match ? match[1].toLowerCase() : defaultExt;
  } catch {
    return defaultExt;
  }
}

export async function migrateImageToSupabase(
  wixUrl: string | null | undefined,
  storagePath: string
): Promise<string | null> {
  const resolved = getResolvedImageUrl(wixUrl);
  if (!resolved) return null;

  const admin = createAdminClient();
  const buffer = await downloadFile(resolved);
  const ext = getExtensionFromUrl(resolved, 'png');
  const fullPath = storagePath.endsWith(`.${ext}`) ? storagePath : `${storagePath}.${ext}`;

  const { error } = await admin.storage.from(MEDIA_BUCKET).upload(fullPath, buffer, {
    contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    upsert: true,
  });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = admin.storage.from(MEDIA_BUCKET).getPublicUrl(fullPath);
  return data.publicUrl;
}

export async function migrateVideoToSupabase(
  wixUrl: string | null | undefined,
  storagePath: string
): Promise<string | null> {
  const resolved = getResolvedVideoUrl(wixUrl);
  if (!resolved) return null;

  const admin = createAdminClient();
  const buffer = await downloadFile(resolved);
  const ext = getExtensionFromUrl(resolved, 'mp4');
  const fullPath = storagePath.endsWith(`.${ext}`) ? storagePath : `${storagePath}.${ext}`;

  const { error } = await admin.storage.from(VIDEOS_BUCKET).upload(fullPath, buffer, {
    contentType: `video/${ext === 'mov' ? 'quicktime' : ext}`,
    upsert: true,
  });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = admin.storage.from(VIDEOS_BUCKET).getPublicUrl(fullPath);
  return data.publicUrl;
}

export function isWixMediaUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  return (
    url.startsWith('wix:image://') ||
    url.startsWith('wix:video://') ||
    url.includes('static.wixstatic.com') ||
    url.includes('video.wixstatic.com')
  );
}

export function isSupabaseUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  return url.includes('supabase') && url.includes('storage');
}
