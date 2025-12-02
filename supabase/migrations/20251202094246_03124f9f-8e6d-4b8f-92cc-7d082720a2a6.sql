-- Force update admin role for me@marcovanhout.com
DO $$
DECLARE
  admin_user_id uuid := '54c86731-a574-4588-8cc3-672408ddece2';
BEGIN
  -- Delete any existing role entry
  DELETE FROM user_roles WHERE user_id = admin_user_id;
  
  -- Insert fresh admin role
  INSERT INTO user_roles (
    user_id, 
    role, 
    analyses_used, 
    analyses_limit, 
    monthly_analyses_used, 
    monthly_analyses_limit,
    pack_analyses_remaining
  )
  VALUES (
    admin_user_id,
    'admin',
    0,
    999999,
    0,
    999999,
    999999
  );
END $$;