-- Run this in Supabase SQL Editor to add account settings columns to members
-- Copy all, paste into SQL Editor, click Run

ALTER TABLE public.members ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS shipping_city TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS shipping_postal_code TEXT;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS shipping_country TEXT;
