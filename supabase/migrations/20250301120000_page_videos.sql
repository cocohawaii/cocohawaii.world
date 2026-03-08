-- ============================================
-- PAGE VIDEOS - Supabase Migration
-- Homepage hero + MakingOf videos by tag
-- ============================================

CREATE TABLE IF NOT EXISTS public.page_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tag TEXT UNIQUE NOT NULL,
  video_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_videos_tag ON public.page_videos(tag);

ALTER TABLE public.page_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read page videos" ON public.page_videos;
CREATE POLICY "Anyone can read page videos"
  ON public.page_videos FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage page videos" ON public.page_videos;
CREATE POLICY "Admins can manage page videos"
  ON public.page_videos FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND m.role = 'admin')
  );

GRANT SELECT ON public.page_videos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.page_videos TO authenticated;
