-- Update me@marcovanhout.com to admin role with unlimited analyses
UPDATE user_roles 
SET role = 'admin', 
    analyses_limit = 999999, 
    monthly_analyses_limit = 999999,
    monthly_analyses_used = 0
WHERE user_id = '54c86731-a574-4588-8cc3-672408ddece2';