-- ============================================
-- COCO HAWAII - Runway Events System
-- Run in Supabase SQL Editor
-- ============================================

-- 1. RUNWAY_EVENTS (uses gen_random_uuid() - built into Postgres 13+)
CREATE TABLE IF NOT EXISTS public.runway_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  guest_list_limit INTEGER,
  ticket_limit INTEGER,
  ticket_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  guest_list_enabled BOOLEAN NOT NULL DEFAULT true,
  tickets_enabled BOOLEAN NOT NULL DEFAULT false,
  items_reveal_hours_after_start INTEGER DEFAULT 0,
  hat_ids UUID[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'upcoming', 'past')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_runway_events_status ON public.runway_events(status);
CREATE INDEX IF NOT EXISTS idx_runway_events_event_date ON public.runway_events(event_date);

-- 2. Add runway_event_id to runway_orders (guest list signups)
ALTER TABLE public.runway_orders
  ADD COLUMN IF NOT EXISTS runway_event_id UUID REFERENCES public.runway_events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_runway_orders_event_id ON public.runway_orders(runway_event_id);

-- Partial unique: legacy (event_date only) and new (runway_event_id)
DROP INDEX IF EXISTS idx_runway_orders_email_event;
CREATE UNIQUE INDEX idx_runway_orders_email_event_legacy
  ON public.runway_orders(email, event_date)
  WHERE runway_event_id IS NULL;
CREATE UNIQUE INDEX idx_runway_orders_email_event_id
  ON public.runway_orders(email, runway_event_id)
  WHERE runway_event_id IS NOT NULL;

-- 3. RUNWAY_TICKETS (paid ticket purchases)
CREATE TABLE IF NOT EXISTS public.runway_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  runway_event_id UUID NOT NULL REFERENCES public.runway_events(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_paid NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_runway_tickets_event ON public.runway_tickets(runway_event_id);
CREATE INDEX IF NOT EXISTS idx_runway_tickets_member ON public.runway_tickets(member_id);
CREATE INDEX IF NOT EXISTS idx_runway_tickets_email ON public.runway_tickets(email);

-- RLS
ALTER TABLE public.runway_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runway_tickets ENABLE ROW LEVEL SECURITY;

-- Runway events: public can read upcoming/past, admins can do all
CREATE POLICY "Public read runway events"
  ON public.runway_events FOR SELECT
  USING (
    status IN ('upcoming', 'past')
    OR EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND (m.role::text ILIKE '%admin%'))
  );

CREATE POLICY "Admins manage runway events"
  ON public.runway_events FOR ALL
  USING (EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND (m.role::text ILIKE '%admin%')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND (m.role::text ILIKE '%admin%')));

-- Runway tickets: users read own, admins read all, anyone can insert (for signup)
CREATE POLICY "Users read own runway tickets"
  ON public.runway_tickets FOR SELECT
  USING (
    member_id IN (SELECT id FROM public.members WHERE auth_id = auth.uid())
    OR email IN (SELECT email FROM public.members WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND (m.role::text ILIKE '%admin%'))
  );

CREATE POLICY "Anyone insert runway tickets"
  ON public.runway_tickets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins manage runway tickets"
  ON public.runway_tickets FOR ALL
  USING (EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND (m.role::text ILIKE '%admin%')));

-- Grant
GRANT SELECT ON public.runway_events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.runway_events TO authenticated;
GRANT SELECT, INSERT ON public.runway_tickets TO anon, authenticated;
GRANT UPDATE, DELETE ON public.runway_tickets TO authenticated;
