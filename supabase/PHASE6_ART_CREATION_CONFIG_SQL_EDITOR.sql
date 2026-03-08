-- ============================================
-- PHASE 6: Run this in Supabase SQL Editor
-- ArtCreation (global art price) → auction_config
-- ============================================
-- Copy all below, paste into SQL Editor, click Run

CREATE TABLE IF NOT EXISTS public.auction_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default art creation config (single row, key = 'art_creation')
INSERT INTO public.auction_config (key, value)
VALUES ('art_creation', '{
  "artBasePrice": 100,
  "artPriceIncrease": "0.01",
  "increaseRate": 6400,
  "artPriceIncreasedTotal": 0,
  "artPriceFinalTotal": 100
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.auction_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read auction config" ON public.auction_config;
CREATE POLICY "Anyone can read auction config"
  ON public.auction_config FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert auction config" ON public.auction_config;
CREATE POLICY "Admins can insert auction config"
  ON public.auction_config FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND (m.role ILIKE '%admin%' OR m.role = 'admin'))
  );

DROP POLICY IF EXISTS "Admins can update auction config" ON public.auction_config;
CREATE POLICY "Admins can update auction config"
  ON public.auction_config FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND (m.role ILIKE '%admin%' OR m.role = 'admin'))
  );

GRANT SELECT ON public.auction_config TO anon, authenticated;
GRANT UPDATE ON public.auction_config TO authenticated;
