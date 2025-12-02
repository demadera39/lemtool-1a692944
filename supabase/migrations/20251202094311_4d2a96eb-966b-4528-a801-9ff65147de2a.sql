-- Direct update to admin role
UPDATE user_roles 
SET 
  role = 'admin'::app_role,
  analyses_limit = 999999,
  monthly_analyses_limit = 999999,
  monthly_analyses_used = 0,
  pack_analyses_remaining = 999999
WHERE user_id = '54c86731-a574-4588-8cc3-672408ddece2';

-- Verify the update
SELECT u.email, ur.role, ur.analyses_limit, ur.monthly_analyses_limit 
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'me@marcovanhout.com';