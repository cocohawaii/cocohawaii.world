-- ============================================
-- PHASE 1: Run this in Supabase SQL Editor
-- CocoHawaiiExoticHats → hats table
-- ============================================
-- Copy all below, paste into SQL Editor, click Run

CREATE TABLE IF NOT EXISTS public.hats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wix_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  hat_subtitle TEXT,
  hat_description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discounted_price NUMERIC(10, 2),
  main_hat_image TEXT,
  top_video_eyes TEXT,
  making_of_product_page TEXT,
  gallery JSONB DEFAULT '[]',
  hat_size TEXT,
  collection TEXT,
  color TEXT,
  slug TEXT,
  is_active BOOLEAN DEFAULT true,
  extra_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hats_wix_id ON public.hats(wix_id);
CREATE INDEX IF NOT EXISTS idx_hats_slug ON public.hats(slug);
CREATE INDEX IF NOT EXISTS idx_hats_is_active ON public.hats(is_active);
CREATE INDEX IF NOT EXISTS idx_hats_collection ON public.hats(collection);
ALTER TABLE public.hats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read active hats" ON public.hats;
CREATE POLICY "Anyone can read active hats" ON public.hats FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admins can read all hats" ON public.hats;
CREATE POLICY "Admins can read all hats" ON public.hats FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND (m.role ILIKE '%admin%' OR m.role = 'admin'))
);
DROP POLICY IF EXISTS "Admins can insert hats" ON public.hats;
CREATE POLICY "Admins can insert hats" ON public.hats FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND (m.role ILIKE '%admin%' OR m.role = 'admin'))
);
DROP POLICY IF EXISTS "Admins can update hats" ON public.hats;
CREATE POLICY "Admins can update hats" ON public.hats FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND (m.role ILIKE '%admin%' OR m.role = 'admin'))
);
GRANT SELECT ON public.hats TO anon, authenticated;
GRANT INSERT, UPDATE ON public.hats TO authenticated;
