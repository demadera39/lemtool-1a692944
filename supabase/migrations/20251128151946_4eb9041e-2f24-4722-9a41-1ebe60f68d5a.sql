-- Update the handle_new_user_role function to set monthly_analyses_limit for free users
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_roles (user_id, role, analyses_used, analyses_limit, monthly_analyses_limit, last_monthly_reset)
  VALUES (NEW.id, 'free', 0, 3, 3, now());
  RETURN NEW;
END;
$function$;

-- Fix existing free users who have 0 monthly_analyses_limit
UPDATE public.user_roles
SET monthly_analyses_limit = 3,
    last_monthly_reset = COALESCE(last_monthly_reset, now())
WHERE role = 'free' 
AND monthly_analyses_limit = 0;