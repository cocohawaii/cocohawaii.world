-- ============================================
-- PHASE 9: Supabase Storage for Media Migration
-- Run in Supabase SQL Editor
-- Creates buckets for hats, videos, etc. (replacing Wix media)
-- ============================================

-- Create media bucket (images: hats, raw_hats, auction_items, hat_accessories)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create videos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies for media bucket: public read, admin write
DROP POLICY IF EXISTS "media_bucket_public_read" ON storage.objects;
CREATE POLICY "media_bucket_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

DROP POLICY IF EXISTS "media_bucket_admin_insert" ON storage.objects;
CREATE POLICY "media_bucket_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media'
    AND EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND (m.role ILIKE '%admin%' OR m.role = 'admin'))
  );

DROP POLICY IF EXISTS "media_bucket_admin_update" ON storage.objects;
CREATE POLICY "media_bucket_admin_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'media'
    AND EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND (m.role ILIKE '%admin%' OR m.role = 'admin'))
  );

-- Storage policies for videos bucket
DROP POLICY IF EXISTS "videos_bucket_public_read" ON storage.objects;
CREATE POLICY "videos_bucket_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'videos');

DROP POLICY IF EXISTS "videos_bucket_admin_insert" ON storage.objects;
CREATE POLICY "videos_bucket_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'videos'
    AND EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND (m.role ILIKE '%admin%' OR m.role = 'admin'))
  );

DROP POLICY IF EXISTS "videos_bucket_admin_update" ON storage.objects;
CREATE POLICY "videos_bucket_admin_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'videos'
    AND EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND (m.role ILIKE '%admin%' OR m.role = 'admin'))
  );

-- Note: Create buckets in Supabase Dashboard → Storage first if they don't exist:
-- 1. New bucket "media" (public, 50MB limit)
-- 2. New bucket "videos" (public, 100MB limit)
-- Or run the INSERT above - Supabase supports inserting into storage.buckets.
