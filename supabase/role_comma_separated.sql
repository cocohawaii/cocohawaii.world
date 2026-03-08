-- Run this in Supabase SQL Editor to allow comma-separated roles (e.g. "user,pr", "admin,pr")
-- This lets members be both "user" and "PR" or "admin" and "PR" at the same time
-- If DROP fails, the constraint may have a different name - check Table Editor > members > Constraints

DO $$
BEGIN
  ALTER TABLE public.members DROP CONSTRAINT members_role_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE public.members ADD CONSTRAINT members_role_check 
  CHECK (role IN ('user', 'admin', 'pr', 'user,pr', 'admin,pr'));
