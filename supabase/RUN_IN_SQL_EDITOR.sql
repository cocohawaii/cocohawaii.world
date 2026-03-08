-- ============================================
-- COCO HAWAII - Run this in Supabase SQL Editor
-- Copy all of this, paste into SQL Editor, click Run
-- ============================================

-- 1. Initial schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'pr', 'user,pr', 'admin,pr', 'user,admin', 'user,pr,admin', 'user,admin,pr')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_members_auth_id ON public.members(auth_id);
CREATE INDEX IF NOT EXISTS idx_members_email ON public.members(email);

CREATE TABLE IF NOT EXISTS public.raffles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  subtitle TEXT,
  ticket_price NUMERIC(10, 2) NOT NULL DEFAULT 5,
  max_entries INTEGER NOT NULL DEFAULT 100,
  total_entries INTEGER NOT NULL DEFAULT 0,
  ticket_limit_per_user INTEGER,
  value_of_pot NUMERIC(10, 2),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'ended')),
  visibility_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  draw_date TIMESTAMPTZ NOT NULL,
  hat_ids UUID[] DEFAULT '{}',
  winner_number INTEGER,
  winner_initials TEXT,
  winner_display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_raffles_status ON public.raffles(status);
CREATE INDEX IF NOT EXISTS idx_raffles_draw_date ON public.raffles(draw_date);

CREATE TABLE IF NOT EXISTS public.raffle_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raffle_id UUID NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_paid NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_raffle_entries_raffle ON public.raffle_entries(raffle_id);
CREATE INDEX IF NOT EXISTS idx_raffle_entries_member ON public.raffle_entries(member_id);

CREATE TABLE IF NOT EXISTS public.raffle_claimed_prizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raffle_id UUID NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  prize_details JSONB NOT NULL DEFAULT '{}',
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(raffle_id, member_id)
);
CREATE INDEX IF NOT EXISTS idx_raffle_claimed_prizes_member ON public.raffle_claimed_prizes(member_id);
CREATE INDEX IF NOT EXISTS idx_raffle_claimed_prizes_raffle ON public.raffle_claimed_prizes(raffle_id);

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raffle_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raffle_claimed_prizes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.members;
CREATE POLICY "Users can read own profile" ON public.members FOR SELECT USING (auth.uid() = auth_id);

DROP POLICY IF EXISTS "Read raffles" ON public.raffles;
CREATE POLICY "Read raffles" ON public.raffles FOR SELECT USING (
  status = 'active' OR EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND m.role = 'admin')
);
DROP POLICY IF EXISTS "Admins can update raffles" ON public.raffles;
CREATE POLICY "Admins can update raffles" ON public.raffles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND m.role = 'admin')
);
DROP POLICY IF EXISTS "Admins can insert raffles" ON public.raffles;
CREATE POLICY "Admins can insert raffles" ON public.raffles FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND m.role = 'admin')
);

DROP POLICY IF EXISTS "Users can read own entries" ON public.raffle_entries;
CREATE POLICY "Users can read own entries" ON public.raffle_entries FOR SELECT USING (
  member_id IN (SELECT id FROM public.members WHERE auth_id = auth.uid())
);
DROP POLICY IF EXISTS "Authenticated users can create entries" ON public.raffle_entries;
CREATE POLICY "Authenticated users can create entries" ON public.raffle_entries FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND member_id IN (SELECT id FROM public.members WHERE auth_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can read own claimed prizes" ON public.raffle_claimed_prizes;
CREATE POLICY "Users can read own claimed prizes" ON public.raffle_claimed_prizes FOR SELECT USING (
  member_id IN (SELECT id FROM public.members WHERE auth_id = auth.uid())
);
DROP POLICY IF EXISTS "Authenticated users can create claimed prizes" ON public.raffle_claimed_prizes;
CREATE POLICY "Authenticated users can create claimed prizes" ON public.raffle_claimed_prizes FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND member_id IN (SELECT id FROM public.members WHERE auth_id = auth.uid())
);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.members TO anon, authenticated;
GRANT SELECT ON public.raffles TO anon, authenticated;
GRANT SELECT, INSERT ON public.raffle_entries TO authenticated;
GRANT SELECT, INSERT ON public.raffle_claimed_prizes TO authenticated;

-- 2. Handle new user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.members (auth_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (auth_id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Members update policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.members;
CREATE POLICY "Users can update own profile" ON public.members FOR UPDATE USING (auth_id = auth.uid()) WITH CHECK (auth_id = auth.uid());
GRANT UPDATE ON public.members TO authenticated;

-- 4. Star bids + enter_raffle_secure
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS star_bids INTEGER NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS star_bids_consumed INTEGER NOT NULL DEFAULT 0;

-- 4b. Account settings (profile, shipping)
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS shipping_city TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS shipping_postal_code TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS shipping_country TEXT;
ALTER TABLE public.raffle_entries ADD COLUMN IF NOT EXISTS ticket_number INTEGER;

CREATE OR REPLACE FUNCTION public.enter_raffle_secure(p_raffle_id UUID, p_quantity INTEGER DEFAULT 1)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_auth_uid UUID; v_member_id UUID; v_member_star_bids INT; v_raffle RECORD;
  v_total_entries INT; v_user_entries INT; v_cost INT; v_new_balance INT; v_ticket_start INT; v_i INT;
BEGIN
  v_auth_uid := auth.uid();
  IF v_auth_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
  p_quantity := GREATEST(1, LEAST(p_quantity, 100));
  SELECT id, COALESCE(star_bids, 0) INTO v_member_id, v_member_star_bids FROM public.members WHERE auth_id = v_auth_uid;
  IF v_member_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Member not found'); END IF;
  SELECT r.*, r.total_entries INTO v_raffle FROM public.raffles r WHERE r.id = p_raffle_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Raffle not found'); END IF;
  IF v_raffle.status != 'active' THEN RETURN jsonb_build_object('success', false, 'error', 'Raffle is not active'); END IF;
  IF NOW() < v_raffle.start_date THEN RETURN jsonb_build_object('success', false, 'error', 'Raffle has not started yet'); END IF;
  IF NOW() > v_raffle.end_date THEN RETURN jsonb_build_object('success', false, 'error', 'Raffle has ended'); END IF;
  v_cost := (v_raffle.ticket_price::INT * p_quantity); IF v_cost < 0 THEN v_cost := 0; END IF;
  IF v_raffle.total_entries + p_quantity > v_raffle.max_entries THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only ' || GREATEST(0, v_raffle.max_entries - v_raffle.total_entries) || ' tickets remaining');
  END IF;
  IF v_raffle.ticket_limit_per_user IS NOT NULL AND v_raffle.ticket_limit_per_user > 0 THEN
    SELECT COALESCE(SUM(quantity), 0)::INT INTO v_user_entries FROM public.raffle_entries WHERE raffle_id = p_raffle_id AND member_id = v_member_id;
    IF v_user_entries + p_quantity > v_raffle.ticket_limit_per_user THEN
      RETURN jsonb_build_object('success', false, 'error', 'You can only buy up to ' || v_raffle.ticket_limit_per_user || ' ticket(s) per raffle. You already have ' || v_user_entries);
    END IF;
  END IF;
  IF v_member_star_bids < v_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient Star Bids!', 'currentBalance', v_member_star_bids, 'required', v_cost);
  END IF;
  v_ticket_start := v_raffle.total_entries + 1;
  FOR v_i IN 1..p_quantity LOOP
    INSERT INTO public.raffle_entries (raffle_id, member_id, quantity, total_paid, ticket_number)
    VALUES (p_raffle_id, v_member_id, 1, v_raffle.ticket_price, v_raffle.total_entries + v_i);
  END LOOP;
  UPDATE public.raffles SET total_entries = total_entries + p_quantity WHERE id = p_raffle_id;
  v_new_balance := v_member_star_bids - v_cost;
  UPDATE public.members SET star_bids = v_new_balance, star_bids_consumed = COALESCE(star_bids_consumed, 0) + v_cost WHERE id = v_member_id;
  RETURN jsonb_build_object('success', true, 'message', 'You entered the raffle with ' || p_quantity || ' ticket(s)!', 'ticketCount', p_quantity, 'totalCost', v_cost, 'newStarBids', v_new_balance, 'ticketStart', v_ticket_start);
END;
$$;
GRANT EXECUTE ON FUNCTION public.enter_raffle_secure(UUID, INTEGER) TO authenticated;

-- 5. Members insert policy
DROP POLICY IF EXISTS "Users can insert own profile" ON public.members;
CREATE POLICY "Users can insert own profile" ON public.members FOR INSERT WITH CHECK (auth_id = auth.uid());
GRANT INSERT ON public.members TO authenticated;

-- ============================================
-- 6. STAR BID PACKS (Stage 1 - Schema)
-- ============================================
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

ALTER TABLE public.star_bid_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.star_bid_pack_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read star bid packs" ON public.star_bid_packs;
CREATE POLICY "Read star bid packs" ON public.star_bid_packs FOR SELECT USING (
  active = true OR EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND m.role = 'admin')
);
DROP POLICY IF EXISTS "Admins can insert star bid packs" ON public.star_bid_packs;
CREATE POLICY "Admins can insert star bid packs" ON public.star_bid_packs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND m.role = 'admin')
);
DROP POLICY IF EXISTS "Admins can update star bid packs" ON public.star_bid_packs;
CREATE POLICY "Admins can update star bid packs" ON public.star_bid_packs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND m.role = 'admin')
);

DROP POLICY IF EXISTS "Users can read own star bid pack purchases" ON public.star_bid_pack_purchases;
CREATE POLICY "Users can read own star bid pack purchases" ON public.star_bid_pack_purchases FOR SELECT USING (
  member_id IN (SELECT id FROM public.members WHERE auth_id = auth.uid())
);
DROP POLICY IF EXISTS "Admins can read all star bid pack purchases" ON public.star_bid_pack_purchases;
CREATE POLICY "Admins can read all star bid pack purchases" ON public.star_bid_pack_purchases FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND m.role = 'admin')
);
DROP POLICY IF EXISTS "Authenticated users can create star bid pack purchases" ON public.star_bid_pack_purchases;
CREATE POLICY "Authenticated users can create star bid pack purchases" ON public.star_bid_pack_purchases FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND member_id IN (SELECT id FROM public.members WHERE auth_id = auth.uid())
);

GRANT SELECT ON public.star_bid_packs TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.star_bid_packs TO authenticated;
GRANT SELECT, INSERT ON public.star_bid_pack_purchases TO authenticated;

-- Optional: Seed sample packs (run separately if needed)
-- INSERT INTO public.star_bid_packs (pack_id, name, detail, stars_amount, price, active) VALUES
--   ('bidPacks1', 'Starter Pack', '100 Star Bids', 100, 5.00, true),
--   ('bidPacks2', 'Pro Pack', '500 Star Bids', 500, 20.00, true),
--   ('bidPacks3', 'Mega Pack', '1000 Star Bids', 1000, 35.00, true)
-- ON CONFLICT (pack_id) DO NOTHING;

-- ============================================
-- AUCTION BIDS (Supabase-authenticated users)
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
CREATE POLICY "Anyone can read auction bids" ON public.auction_bids FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can create auction bids" ON public.auction_bids;
CREATE POLICY "Authenticated users can create auction bids" ON public.auction_bids FOR INSERT WITH CHECK (
  member_id IN (SELECT id FROM public.members WHERE auth_id = auth.uid())
);
GRANT SELECT, INSERT ON public.auction_bids TO anon, authenticated;

-- ============================================
-- PAGE VIDEOS (Homepage hero + MakingOf)
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
CREATE POLICY "Anyone can read page videos" ON public.page_videos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage page videos" ON public.page_videos;
CREATE POLICY "Admins can manage page videos" ON public.page_videos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND m.role = 'admin')
);
GRANT SELECT ON public.page_videos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.page_videos TO authenticated;

-- ============================================
-- HOME DECOR
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
CREATE POLICY "Anyone can read active home decor" ON public.home_decor FOR SELECT USING (
  is_active = true OR EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND m.role = 'admin')
);
DROP POLICY IF EXISTS "Admins can manage home decor" ON public.home_decor;
CREATE POLICY "Admins can manage home decor" ON public.home_decor FOR ALL
  USING (EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND m.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND m.role = 'admin'));
GRANT SELECT ON public.home_decor TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.home_decor TO authenticated;

-- ============================================
-- PAGE ANALYTICS (visits, signups, logins)
-- ============================================
CREATE TABLE IF NOT EXISTS public.page_analytics_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(page, visitor_id)
);
CREATE INDEX IF NOT EXISTS idx_page_analytics_visits_page ON public.page_analytics_visits(page);
CREATE INDEX IF NOT EXISTS idx_page_analytics_visits_visitor ON public.page_analytics_visits(visitor_id);

CREATE TABLE IF NOT EXISTS public.page_analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL CHECK (event_type IN ('signup', 'login')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_page_analytics_events_type ON public.page_analytics_events(event_type);

ALTER TABLE public.page_analytics_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_analytics_events ENABLE ROW LEVEL SECURITY;

-- API uses createAdminClient (service role) which bypasses RLS - no policies needed for API access
