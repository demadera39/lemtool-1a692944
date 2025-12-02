-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

-- Update the user with email me@marcovanhout.com to have admin role
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get the user_id for me@marcovanhout.com from auth.users
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'me@marcovanhout.com';
  
  IF admin_user_id IS NOT NULL THEN
    -- Update or insert the admin role
    INSERT INTO user_roles (user_id, role, analyses_used, analyses_limit, monthly_analyses_limit, monthly_analyses_used)
    VALUES (admin_user_id, 'admin', 0, 999999, 999999, 0)
    ON CONFLICT (user_id) 
    DO UPDATE SET role = 'admin', analyses_limit = 999999, monthly_analyses_limit = 999999;
  END IF;
END $$;

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Allow admins to update user_roles
CREATE POLICY "Admins can update user roles"
ON user_roles
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Allow admins to view all user_roles
CREATE POLICY "Admins can view all user roles"
ON user_roles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Allow admins to view all projects
CREATE POLICY "Admins can view all projects"
ON projects
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));