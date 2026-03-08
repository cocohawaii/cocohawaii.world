import { createAdminClient } from '@/lib/supabase/admin';
import { convertWixVideoUrl } from '@/lib/wix-utils';

/**
 * Get page video URL by tag from Supabase page_videos.
 */
export async function getPageVideoUrlByTag(tag: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('page_videos')
    .select('video_url')
    .eq('tag', tag.trim())
    .single();

  if (!data?.video_url) return null;
  return convertWixVideoUrl(data.video_url) || data.video_url;
}
