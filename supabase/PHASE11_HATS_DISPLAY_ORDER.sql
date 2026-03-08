-- ============================================
-- PHASE 11: Hats display order for admin sorting
-- Run in Supabase SQL Editor
-- ============================================

-- Add display_order column (nullable; null = use created_at for ordering)
ALTER TABLE public.hats
ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Index for efficient ordering
CREATE INDEX IF NOT EXISTS idx_hats_display_order ON public.hats(display_order);
CREATE INDEX IF NOT EXISTS idx_hats_created_at ON public.hats(created_at DESC);
