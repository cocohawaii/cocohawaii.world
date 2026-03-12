-- Add payment_status and sumup_checkout_id to customized_hat_orders for SumUp checkout flow

ALTER TABLE public.customized_hat_orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'refunded')),
  ADD COLUMN IF NOT EXISTS sumup_checkout_id TEXT;

CREATE INDEX IF NOT EXISTS idx_customized_hat_orders_sumup_checkout
  ON public.customized_hat_orders(sumup_checkout_id)
  WHERE sumup_checkout_id IS NOT NULL;
