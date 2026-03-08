-- ============================================
-- COCO HAWAII - Supabase Migration
-- Raffles, Members, Entries, Claimed Prizes
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. MEMBERS
-- ============================================
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'pr')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for auth lookup
CREATE INDEX idx_members_auth_id ON public.members(auth_id);
CREATE INDEX idx_members_email ON public.members(email);

-- ============================================
-- 2. RAFFLES
-- ============================================
CREATE TABLE public.raffles (
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

CREATE INDEX idx_raffles_status ON public.raffles(status);
CREATE INDEX idx_raffles_draw_date ON public.raffles(draw_date);

-- ============================================
-- 3. RAFFLE_ENTRIES
-- ============================================
CREATE TABLE public.raffle_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raffle_id UUID NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_paid NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_raffle_entries_raffle ON public.raffle_entries(raffle_id);
CREATE INDEX idx_raffle_entries_member ON public.raffle_entries(member_id);

-- ============================================
-- 4. RAFFLE_CLAIMED_PRIZES
-- ============================================
CREATE TABLE public.raffle_claimed_prizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raffle_id UUID NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  prize_details JSONB NOT NULL DEFAULT '{}',
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(raffle_id, member_id)
);

CREATE INDEX idx_raffle_claimed_prizes_member ON public.raffle_claimed_prizes(member_id);
CREATE INDEX idx_raffle_claimed_prizes_raffle ON public.raffle_claimed_prizes(raffle_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raffle_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raffle_claimed_prizes ENABLE ROW LEVEL SECURITY;

-- ----- MEMBERS -----
-- Users can read their own profile (by auth_id)
CREATE POLICY "Users can read own profile"
  ON public.members FOR SELECT
  USING (auth.uid() = auth_id);

-- Service role can do everything (admin client)
-- RLS still applies but service_role bypasses it by default

-- ----- RAFFLES -----
-- Anyone can read active raffles; admins can read all
CREATE POLICY "Read raffles"
  ON public.raffles FOR SELECT
  USING (
    status = 'active'
    OR EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.auth_id = auth.uid() AND m.role = 'admin'
    )
  );

-- Admins can update raffles
CREATE POLICY "Admins can update raffles"
  ON public.raffles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.auth_id = auth.uid() AND m.role = 'admin'
    )
  );

-- Admins can insert raffles
CREATE POLICY "Admins can insert raffles"
  ON public.raffles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.auth_id = auth.uid() AND m.role = 'admin'
    )
  );

-- ----- RAFFLE_ENTRIES -----
-- Users can read their own entries
CREATE POLICY "Users can read own entries"
  ON public.raffle_entries FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE auth_id = auth.uid()
    )
  );

-- Authenticated users can create entries (for themselves)
CREATE POLICY "Authenticated users can create entries"
  ON public.raffle_entries FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND member_id IN (
      SELECT id FROM public.members WHERE auth_id = auth.uid()
    )
  );

-- ----- RAFFLE_CLAIMED_PRIZES -----
-- Users can read their own claimed prizes
CREATE POLICY "Users can read own claimed prizes"
  ON public.raffle_claimed_prizes FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE auth_id = auth.uid()
    )
  );

-- Authenticated users can create claimed prizes (for themselves)
CREATE POLICY "Authenticated users can create claimed prizes"
  ON public.raffle_claimed_prizes FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND member_id IN (
      SELECT id FROM public.members WHERE auth_id = auth.uid()
    )
  );

-- ============================================
-- GRANT USAGE
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.members TO anon, authenticated;
GRANT SELECT ON public.raffles TO anon, authenticated;
GRANT SELECT, INSERT ON public.raffle_entries TO authenticated;
GRANT SELECT, INSERT ON public.raffle_claimed_prizes TO authenticated;
