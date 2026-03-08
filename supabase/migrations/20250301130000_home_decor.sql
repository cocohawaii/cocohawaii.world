-- ============================================
-- HOME DECOR - Supabase Migration
-- Stage 1: Schema
-- ============================================

CREATE TABLE IF NOT EXISTS public.home_decor (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discounted_price NUMERIC(10, 2),
  main_image TEXT DEFAULT '',
  description TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_home_decor_slug ON public.home_decor(slug);
CREATE INDEX IF NOT EXISTS idx_home_decor_active ON public.home_decor(is_active);

ALTER TABLE public.home_decor ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active home decor" ON public.home_decor;
CREATE POLICY "Anyone can read active home decor"
  ON public.home_decor FOR SELECT
  USING (
    is_active = true
    OR EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND m.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can manage home decor" ON public.home_decor;
CREATE POLICY "Admins can manage home decor"
  ON public.home_decor FOR ALL
  USING (EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND m.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND m.role = 'admin'));

GRANT SELECT ON public.home_decor TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.home_decor TO authenticated;
