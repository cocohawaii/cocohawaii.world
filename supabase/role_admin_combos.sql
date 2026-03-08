-- Run in Supabase SQL Editor
-- Allows role combos like user,admin and user,pr,admin
-- Updates RLS so "user,admin" grants admin access (not just role='admin')

-- 1. Expand role constraint
DO $$
BEGIN
  ALTER TABLE public.members DROP CONSTRAINT members_role_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE public.members ADD CONSTRAINT members_role_check 
  CHECK (role IN (
    'user', 'admin', 'pr',
    'user,pr', 'admin,pr', 'user,admin',
    'user,pr,admin', 'user,admin,pr'
  ));

-- 2. Helper: check if role string contains a tag (e.g. admin in "user,admin")
CREATE OR REPLACE FUNCTION public.role_contains(role_text TEXT, tag TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (',' || COALESCE(role_text,'') || ',') LIKE '%,' || tag || ',%';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Update RLS policies to use role_contains for admin check
-- Raffles
DROP POLICY IF EXISTS "Read raffles" ON public.raffles;
CREATE POLICY "Read raffles" ON public.raffles FOR SELECT USING (
  status = 'active' OR EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND public.role_contains(m.role, 'admin'))
);
DROP POLICY IF EXISTS "Admins can update raffles" ON public.raffles;
CREATE POLICY "Admins can update raffles" ON public.raffles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND public.role_contains(m.role, 'admin'))
);
DROP POLICY IF EXISTS "Admins can insert raffles" ON public.raffles;
CREATE POLICY "Admins can insert raffles" ON public.raffles FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND public.role_contains(m.role, 'admin'))
);

-- Star bid packs
DROP POLICY IF EXISTS "Read star bid packs" ON public.star_bid_packs;
CREATE POLICY "Read star bid packs" ON public.star_bid_packs FOR SELECT USING (
  active = true OR EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND public.role_contains(m.role, 'admin'))
);
DROP POLICY IF EXISTS "Admins can insert star bid packs" ON public.star_bid_packs;
CREATE POLICY "Admins can insert star bid packs" ON public.star_bid_packs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND public.role_contains(m.role, 'admin'))
);
DROP POLICY IF EXISTS "Admins can update star bid packs" ON public.star_bid_packs;
CREATE POLICY "Admins can update star bid packs" ON public.star_bid_packs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND public.role_contains(m.role, 'admin'))
);
DROP POLICY IF EXISTS "Admins can read all star bid pack purchases" ON public.star_bid_pack_purchases;
CREATE POLICY "Admins can read all star bid pack purchases" ON public.star_bid_pack_purchases FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND public.role_contains(m.role, 'admin'))
);

-- Page videos
DROP POLICY IF EXISTS "Admins can manage page videos" ON public.page_videos;
CREATE POLICY "Admins can manage page videos" ON public.page_videos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND public.role_contains(m.role, 'admin'))
)
WITH CHECK (EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND public.role_contains(m.role, 'admin')));

-- Home decor
DROP POLICY IF EXISTS "Anyone can read active home decor" ON public.home_decor;
CREATE POLICY "Anyone can read active home decor" ON public.home_decor FOR SELECT USING (
  is_active = true OR EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND public.role_contains(m.role, 'admin'))
);
DROP POLICY IF EXISTS "Admins can manage home decor" ON public.home_decor;
CREATE POLICY "Admins can manage home decor" ON public.home_decor FOR ALL
  USING (EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND public.role_contains(m.role, 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.members m WHERE m.auth_id = auth.uid() AND public.role_contains(m.role, 'admin')));
