-- Add sumup_checkout_id to runway_tickets for SumUp card widget integration
ALTER TABLE public.runway_tickets
  ADD COLUMN IF NOT EXISTS sumup_checkout_id TEXT;

CREATE INDEX IF NOT EXISTS idx_runway_tickets_sumup_checkout
  ON public.runway_tickets(sumup_checkout_id)
  WHERE sumup_checkout_id IS NOT NULL;
