-- ============================================
-- STAR BID PACKS - Supabase Migration
-- Stage 1: Schema
-- ============================================

-- 1. STAR_BID_PACKS (catalog of packs)
CREATE TABLE IF NOT EXISTS public.star_bid_packs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pack_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  detail TEXT,
  stars_amount INTEGER NOT NULL DEFAULT 0,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_star_bid_packs_active ON public.star_bid_packs(active);
CREATE INDEX IF NOT EXISTS idx_star_bid_packs_pack_id ON public.star_bid_packs(pack_id);

-- 2. STAR_BID_PACK_PURCHASES (purchase history)
CREATE TABLE IF NOT EXISTS public.star_bid_pack_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  pack_id TEXT NOT NULL,
  pack_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_stars INTEGER NOT NULL DEFAULT 0,
  total_price_eur NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'Completed',
  payment_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_star_bid_pack_purchases_member ON public.star_bid_pack_purchases(member_id);
CREATE INDEX IF NOT EXISTS idx_star_bid_pack_purchases_pack ON public.star_bid_pack_purchases(pack_id);
CREATE INDEX IF NOT EXISTS idx_star_bid_pack_purchases_created ON public.star_bid_pack_purchases(created_at DESC);

-- 3. RLS
ALTER TABLE public.star_bid_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.star_bid_pack_purchases ENABLE ROW LEVEL SECURITY;

-- Anyone can read active packs; admins can read all
DROP POLICY IF EXISTS "Read star bid packs" ON public.star_bid_packs;
CREATE POLICY "Read star bid packs"
  ON public.star_bid_packs FOR SELECT
  USING (
    active = true
    OR EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.auth_id = auth.uid() AND m.role = 'admin'
    )
  );

-- Admins can manage packs (insert, update)
DROP POLICY IF EXISTS "Admins can insert star bid packs" ON public.star_bid_packs;
CREATE POLICY "Admins can insert star bid packs"
  ON public.star_bid_packs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.auth_id = auth.uid() AND m.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update star bid packs" ON public.star_bid_packs;
CREATE POLICY "Admins can update star bid packs"
  ON public.star_bid_packs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.auth_id = auth.uid() AND m.role = 'admin'
    )
  );

-- Users can read their own purchases
DROP POLICY IF EXISTS "Users can read own star bid pack purchases" ON public.star_bid_pack_purchases;
CREATE POLICY "Users can read own star bid pack purchases"
  ON public.star_bid_pack_purchases FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE auth_id = auth.uid()
    )
  );

-- Admins can read all purchases
DROP POLICY IF EXISTS "Admins can read all star bid pack purchases" ON public.star_bid_pack_purchases;
CREATE POLICY "Admins can read all star bid pack purchases"
  ON public.star_bid_pack_purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.auth_id = auth.uid() AND m.role = 'admin'
    )
  );

-- Authenticated users can create purchases (for themselves)
DROP POLICY IF EXISTS "Authenticated users can create star bid pack purchases" ON public.star_bid_pack_purchases;
CREATE POLICY "Authenticated users can create star bid pack purchases"
  ON public.star_bid_pack_purchases FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND member_id IN (
      SELECT id FROM public.members WHERE auth_id = auth.uid()
    )
  );

-- 4. GRANTS
GRANT SELECT ON public.star_bid_packs TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.star_bid_packs TO authenticated;
GRANT SELECT, INSERT ON public.star_bid_pack_purchases TO authenticated;
