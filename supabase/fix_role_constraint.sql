-- Run in Supabase SQL Editor - fixes "members_role_check" for admin onboarding
-- Copy, paste, Run

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
