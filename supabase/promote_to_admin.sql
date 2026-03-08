-- ============================================
-- Promote a member to admin
-- Run in Supabase SQL Editor
-- Replace 'your@email.com' with the member's email
-- ============================================

-- Option 1: Promote by email (keeps existing roles like pr)
UPDATE public.members
SET role = CASE
  WHEN role = 'user' THEN 'admin'
  WHEN role = 'user,pr' THEN 'admin,pr'
  WHEN role = 'pr' THEN 'admin,pr'
  ELSE 'admin'
END
WHERE email = 'your@email.com';

-- Option 2: Force to admin,pr (if they were user,pr)
-- UPDATE public.members SET role = 'admin,pr' WHERE email = 'your@email.com';

-- Option 3: Force to admin only
-- UPDATE public.members SET role = 'admin' WHERE email = 'your@email.com';
