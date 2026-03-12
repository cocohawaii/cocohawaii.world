-- Add payment_status, sumup_checkout_id, hat_wix_id to hat_orders for SumUp checkout flow
-- Run in Supabase SQL Editor if migrations aren't applied automatically

ALTER TABLE public.hat_orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'refunded')),
  ADD COLUMN IF NOT EXISTS sumup_checkout_id TEXT,
  ADD COLUMN IF NOT EXISTS hat_wix_id TEXT;

-- For new SumUp orders we use payment_status='pending' until PAID
-- Existing orders keep payment_status='completed' (default)

CREATE INDEX IF NOT EXISTS idx_hat_orders_sumup_checkout
  ON public.hat_orders(sumup_checkout_id)
  WHERE sumup_checkout_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hat_orders_hat_wix_id
  ON public.hat_orders(hat_wix_id)
  WHERE hat_wix_id IS NOT NULL;
