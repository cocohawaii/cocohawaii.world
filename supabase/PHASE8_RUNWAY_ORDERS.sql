-- Phase 8: Runway guest list (replaces Wix RunwayOrders)
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.runway_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  event_date TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_runway_orders_email ON public.runway_orders(email);
CREATE INDEX IF NOT EXISTS idx_runway_orders_event_date ON public.runway_orders(event_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_runway_orders_email_event ON public.runway_orders(email, event_date);

ALTER TABLE public.runway_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert runway orders" ON public.runway_orders;
CREATE POLICY "Anyone can insert runway orders" ON public.runway_orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read runway orders" ON public.runway_orders;
CREATE POLICY "Admins can read runway orders" ON public.runway_orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND m.role = 'admin')
);

GRANT INSERT ON public.runway_orders TO anon, authenticated;
GRANT SELECT ON public.runway_orders TO authenticated;
