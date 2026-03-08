-- ============================================
-- PHASE 12: Add is_sold column to hats
-- Run this in Supabase SQL Editor
-- ============================================

ALTER TABLE public.hats
ADD COLUMN IF NOT EXISTS is_sold BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_hats_is_sold ON public.hats(is_sold);

COMMENT ON COLUMN public.hats.is_sold IS 'When true, hat is sold and not available for purchase';
