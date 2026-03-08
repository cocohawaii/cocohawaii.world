-- ============================================
-- PHASE 3: Run this in Supabase SQL Editor
-- rawHatCollection → raw_hats
-- HatAccessories → hat_accessories
-- ============================================
-- Copy all below, paste into SQL Editor, click Run

-- raw_hats (hat shapes/colors for customizer)
CREATE TABLE IF NOT EXISTS public.raw_hats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wix_id TEXT UNIQUE NOT NULL,
  hat_form TEXT,
  hat_color_name TEXT,
  hat_product_name TEXT,
  hat_product_image TEXT,
  hat_color JSONB DEFAULT '[]',
  hat_color_hex TEXT,
  raw_hat_price NUMERIC(10, 2) DEFAULT 0,
  raw_hat_id TEXT,
  extra_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_raw_hats_wix_id ON public.raw_hats(wix_id);
CREATE INDEX IF NOT EXISTS idx_raw_hats_hat_form ON public.raw_hats(hat_form);
ALTER TABLE public.raw_hats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read raw hats" ON public.raw_hats;
CREATE POLICY "Anyone can read raw hats" ON public.raw_hats FOR SELECT USING (true);
GRANT SELECT ON public.raw_hats TO anon, authenticated;

-- hat_accessories (for customizer)
CREATE TABLE IF NOT EXISTS public.hat_accessories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wix_id TEXT UNIQUE NOT NULL,
  accessory_type TEXT,
  accessory_tags JSONB DEFAULT '[]',
  title TEXT,
  image_url TEXT,
  price NUMERIC(10, 2) DEFAULT 0,
  extra_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hat_accessories_wix_id ON public.hat_accessories(wix_id);
CREATE INDEX IF NOT EXISTS idx_hat_accessories_type ON public.hat_accessories(accessory_type);
ALTER TABLE public.hat_accessories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read hat accessories" ON public.hat_accessories;
CREATE POLICY "Anyone can read hat accessories" ON public.hat_accessories FOR SELECT USING (true);
GRANT SELECT ON public.hat_accessories TO anon, authenticated;
