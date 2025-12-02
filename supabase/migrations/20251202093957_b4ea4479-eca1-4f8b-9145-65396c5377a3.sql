-- Allow users to insert their own user role (needed for new signups)
CREATE POLICY "Users can insert their own role"
ON user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);