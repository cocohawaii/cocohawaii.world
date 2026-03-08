-- ============================================
-- AUCTION BIDS - Supabase Migration
-- Bids from Supabase-authenticated users
-- Auction items stay in Wix CMS
-- ============================================

CREATE TABLE IF NOT EXISTS public.auction_bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id TEXT NOT NULL,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  bid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  bid_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  user_bid_count INTEGER NOT NULL DEFAULT 1,
  user_bid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  user_bid_price_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  bid_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  item_name TEXT,
  item_type TEXT,
  item_image TEXT,
  member_email TEXT,
  member_name TEXT,
  member_username TEXT
);

CREATE INDEX IF NOT EXISTS idx_auction_bids_item ON public.auction_bids(item_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_member ON public.auction_bids(member_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_date ON public.auction_bids(bid_date DESC);

ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read auction bids" ON public.auction_bids;
CREATE POLICY "Anyone can read auction bids"
  ON public.auction_bids FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create auction bids" ON public.auction_bids;
CREATE POLICY "Authenticated users can create auction bids"
  ON public.auction_bids FOR INSERT
  WITH CHECK (
    member_id IN (SELECT id FROM public.members WHERE auth_id = auth.uid())
  );

GRANT SELECT, INSERT ON public.auction_bids TO anon, authenticated;
