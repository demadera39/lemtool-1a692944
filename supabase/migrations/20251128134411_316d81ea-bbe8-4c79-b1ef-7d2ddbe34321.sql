-- Add unique constraint on user_id in user_roles table
ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);