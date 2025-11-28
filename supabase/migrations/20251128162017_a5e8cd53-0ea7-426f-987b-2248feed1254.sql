-- Update free tier to give 3 initial analyses, then 1 per month after that
-- First, update the reset function to give 1 analysis per month for free users
CREATE OR REPLACE FUNCTION public.reset_monthly_analyses_if_needed(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_reset TIMESTAMP WITH TIME ZONE;
  v_role app_role;
BEGIN
  SELECT last_monthly_reset, role INTO v_last_reset, v_role
  FROM public.user_roles
  WHERE user_id = _user_id;
  
  -- Reset if more than 30 days have passed
  IF v_last_reset IS NULL OR (now() - v_last_reset) > INTERVAL '30 days' THEN
    -- Free users get 1 per month after initial signup
    -- Premium users get their full monthly limit
    UPDATE public.user_roles
    SET monthly_analyses_used = 0,
        monthly_analyses_limit = CASE 
          WHEN role = 'free' THEN 1 
          WHEN role = 'premium' THEN 10 
          ELSE monthly_analyses_limit 
        END,
        last_monthly_reset = now()
    WHERE user_id = _user_id;
  END IF;
END;
$$;

-- Set all existing free users to have used their initial 3, so they get 1 next month
UPDATE public.user_roles
SET monthly_analyses_limit = 3,
    monthly_analyses_used = LEAST(monthly_analyses_used, 3)
WHERE role = 'free';

-- Update the new user role handler to give 3 initial free analyses
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, analyses_used, analyses_limit, monthly_analyses_limit, monthly_analyses_used, last_monthly_reset)
  VALUES (NEW.id, 'free', 0, 3, 3, 0, now());
  RETURN NEW;
END;
$$;