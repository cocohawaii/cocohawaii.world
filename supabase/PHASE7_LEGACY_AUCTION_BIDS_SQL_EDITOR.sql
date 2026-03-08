-- ============================================
-- PHASE 7: Run this in Supabase SQL Editor
-- ArtAllBids (legacy Wix bids) → legacy_auction_bids
-- For display-only archival; no member FK
-- ============================================
-- Copy all below, paste into SQL Editor, click Run

CREATE TABLE IF NOT EXISTS public.legacy_auction_bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wix_id TEXT,
  item_id TEXT NOT NULL,
  item_name TEXT,
  item_type TEXT,
  item_image TEXT,
  bid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  bid_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  user_bid_count INTEGER NOT NULL DEFAULT 1,
  user_bid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  user_bid_price_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  bid_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  member_email TEXT,
  member_username TEXT,
  member_name TEXT,
  legacy_member_id TEXT,
  total_countdown_left TEXT,
  art_price_final_total TEXT,
  item_winners TEXT
);

CREATE INDEX IF NOT EXISTS idx_legacy_auction_bids_item ON public.legacy_auction_bids(item_id);
CREATE INDEX IF NOT EXISTS idx_legacy_auction_bids_date ON public.legacy_auction_bids(bid_date DESC);
CREATE INDEX IF NOT EXISTS idx_legacy_auction_bids_member_email ON public.legacy_auction_bids(member_email);

ALTER TABLE public.legacy_auction_bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read legacy auction bids" ON public.legacy_auction_bids;
CREATE POLICY "Anyone can read legacy auction bids"
  ON public.legacy_auction_bids FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert legacy auction bids" ON public.legacy_auction_bids;
CREATE POLICY "Admins can insert legacy auction bids"
  ON public.legacy_auction_bids FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND (m.role ILIKE '%admin%' OR m.role = 'admin'))
  );

GRANT SELECT ON public.legacy_auction_bids TO anon, authenticated;
GRANT INSERT ON public.legacy_auction_bids TO authenticated;
