-- Allow users to insert their own member row (for auto-create when missing)
CREATE POLICY "Users can insert own profile"
  ON public.members FOR INSERT
  WITH CHECK (auth_id = auth.uid());

GRANT INSERT ON public.members TO authenticated;
