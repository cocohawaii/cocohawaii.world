-- ============================================
-- PHASE 2: Run this in Supabase SQL Editor
-- hatOrders (pre-made hat orders) → hat_orders table
-- ============================================
-- Copy all below, paste into SQL Editor, click Run

CREATE TABLE IF NOT EXISTS public.hat_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wix_id TEXT UNIQUE NOT NULL,
  order_id TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_mobile TEXT,
  customer_address TEXT,
  shipping_city TEXT,
  shipping_postal_code TEXT,
  shipping_country TEXT,
  hat_title TEXT NOT NULL,
  hat_subtitle TEXT,
  hat_image TEXT,
  hat_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  shipping_cost NUMERIC(10, 2) DEFAULT 0,
  total_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  shipping_option TEXT,
  custom_ask TEXT,
  pr_referral_id TEXT,
  order_created_on TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hat_orders_wix_id ON public.hat_orders(wix_id);
CREATE INDEX IF NOT EXISTS idx_hat_orders_order_id ON public.hat_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_hat_orders_created ON public.hat_orders(order_created_on DESC NULLS LAST);
ALTER TABLE public.hat_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read hat orders" ON public.hat_orders;
CREATE POLICY "Admins can read hat orders" ON public.hat_orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND (m.role ILIKE '%admin%' OR m.role = 'admin'))
);
DROP POLICY IF EXISTS "Admins can insert hat orders" ON public.hat_orders;
CREATE POLICY "Admins can insert hat orders" ON public.hat_orders FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND (m.role ILIKE '%admin%' OR m.role = 'admin'))
);
GRANT SELECT, INSERT ON public.hat_orders TO authenticated;
