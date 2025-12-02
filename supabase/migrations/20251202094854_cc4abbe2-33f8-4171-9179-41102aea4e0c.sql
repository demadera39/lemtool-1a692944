-- Set admin role one final time after fixing the check-subscription function
UPDATE user_roles 
SET role = 'admin'::app_role
WHERE user_id = '54c86731-a574-4588-8cc3-672408ddece2';