-- ============================================
-- PHASE 4: Run this in Supabase SQL Editor
-- CustomizedHatOrders → customized_hat_orders
-- ============================================
-- Copy all below, paste into SQL Editor, click Run

CREATE TABLE IF NOT EXISTS public.customized_hat_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wix_id TEXT UNIQUE,
  group_order_id TEXT NOT NULL,
  hat_form JSONB DEFAULT '[]',
  hat_color_name TEXT,
  hat_product_image TEXT,
  raw_hat_price NUMERIC(10, 2) DEFAULT 0,
  raw_hat_id TEXT,
  art TEXT,
  art_colors TEXT,
  art_description TEXT,
  precious_stones TEXT,
  precious_stone_type TEXT,
  jewelry TEXT,
  jewelry_type TEXT,
  fabric TEXT,
  notes TEXT,
  birth_date TEXT,
  client_description TEXT,
  indv_raw_hat_n_accessory_total_live_price NUMERIC(10, 2) DEFAULT 0,
  email TEXT,
  name TEXT,
  mobile TEXT,
  phone_code TEXT,
  address TEXT,
  shipping_price NUMERIC(10, 2) DEFAULT 0,
  shipping_type TEXT,
  final_total_price NUMERIC(10, 2) DEFAULT 0,
  payment_method TEXT,
  order_paid BOOLEAN DEFAULT false,
  order_created_on TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customized_hat_orders_group ON public.customized_hat_orders(group_order_id);
CREATE INDEX IF NOT EXISTS idx_customized_hat_orders_created ON public.customized_hat_orders(order_created_on DESC NULLS LAST);
ALTER TABLE public.customized_hat_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read customized hat orders" ON public.customized_hat_orders;
CREATE POLICY "Admins can read customized hat orders" ON public.customized_hat_orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND (m.role ILIKE '%admin%' OR m.role = 'admin'))
);
DROP POLICY IF EXISTS "Authenticated can insert customized hat orders" ON public.customized_hat_orders;
CREATE POLICY "Authenticated can insert customized hat orders" ON public.customized_hat_orders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
GRANT SELECT, INSERT ON public.customized_hat_orders TO authenticated;
