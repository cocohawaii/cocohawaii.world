-- Allow users to update their own member profile (e.g. role for Become PR)
CREATE POLICY "Users can update own profile"
  ON public.members FOR UPDATE
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- Grant UPDATE on members to authenticated users
GRANT UPDATE ON public.members TO authenticated;
