-- ============================================
-- PHASE 5: Run this in Supabase SQL Editor
-- ArtCreationBidding → auction_items table
-- ============================================
-- Copy all below, paste into SQL Editor, click Run

CREATE TABLE IF NOT EXISTS public.auction_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wix_id TEXT UNIQUE NOT NULL,
  item_auction_id TEXT,
  bid_item_name TEXT NOT NULL,
  bid_item_type TEXT,
  image_bid_item TEXT,
  launch_bid_item_date TIMESTAMPTZ NOT NULL,
  auction_item_end_date TIMESTAMPTZ NOT NULL,
  auction_item_visible_date TIMESTAMPTZ,
  active_bid_item BOOLEAN DEFAULT true,
  bid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  bid_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  bid_increase_rate NUMERIC(12, 2) DEFAULT 0,
  bid_price_division NUMERIC(12, 2) DEFAULT 1,
  art_base_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  art_price_increase TEXT,
  increase_rate INTEGER DEFAULT 6400,
  art_price_increased_total_count INTEGER,
  art_price_increased_total TEXT,
  art_price_final_total TEXT,
  total_countdown TEXT,
  total_count_done TEXT,
  total_countdown_left TEXT,
  total_time_elapsed_ms BIGINT,
  all_users_bid_count INTEGER,
  all_users_bid_amount NUMERIC(12, 2),
  all_users_bid_price_amount NUMERIC(12, 2),
  tag_item_type TEXT,
  extra_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auction_items_wix_id ON public.auction_items(wix_id);
CREATE INDEX IF NOT EXISTS idx_auction_items_active ON public.auction_items(active_bid_item);
CREATE INDEX IF NOT EXISTS idx_auction_items_launch ON public.auction_items(launch_bid_item_date);

ALTER TABLE public.auction_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active auction items" ON public.auction_items;
CREATE POLICY "Anyone can read active auction items"
  ON public.auction_items FOR SELECT
  USING (active_bid_item = true);

DROP POLICY IF EXISTS "Admins can read all auction items" ON public.auction_items;
CREATE POLICY "Admins can read all auction items"
  ON public.auction_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND (m.role ILIKE '%admin%' OR m.role = 'admin'))
  );

DROP POLICY IF EXISTS "Admins can insert auction items" ON public.auction_items;
CREATE POLICY "Admins can insert auction items"
  ON public.auction_items FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND (m.role ILIKE '%admin%' OR m.role = 'admin'))
  );

DROP POLICY IF EXISTS "Admins can update auction items" ON public.auction_items;
CREATE POLICY "Admins can update auction items"
  ON public.auction_items FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND (m.role ILIKE '%admin%' OR m.role = 'admin'))
  );

GRANT SELECT ON public.auction_items TO anon, authenticated;
GRANT INSERT, UPDATE ON public.auction_items TO authenticated;
