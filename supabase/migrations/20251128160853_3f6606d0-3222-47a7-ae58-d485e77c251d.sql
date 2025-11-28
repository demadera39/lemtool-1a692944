-- Fix increment_analysis_count to work for both free and premium users
CREATE OR REPLACE FUNCTION public.increment_analysis_count(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role app_role;
  v_monthly_used INTEGER;
  v_monthly_limit INTEGER;
  v_pack_remaining INTEGER;
BEGIN
  -- First reset monthly if needed
  PERFORM public.reset_monthly_analyses_if_needed(_user_id);
  
  -- Get current state
  SELECT role, monthly_analyses_used, monthly_analyses_limit, pack_analyses_remaining
  INTO v_role, v_monthly_used, v_monthly_limit, v_pack_remaining
  FROM public.user_roles
  WHERE user_id = _user_id;
  
  -- Prioritize monthly analyses if available (for BOTH free and premium users)
  IF v_monthly_used < v_monthly_limit THEN
    UPDATE public.user_roles
    SET monthly_analyses_used = monthly_analyses_used + 1
    WHERE user_id = _user_id;
  -- Otherwise use pack analyses
  ELSIF v_pack_remaining > 0 THEN
    UPDATE public.user_roles
    SET pack_analyses_remaining = pack_analyses_remaining - 1
    WHERE user_id = _user_id;
  END IF;
  
  -- Also increment the legacy counter for backwards compatibility
  UPDATE public.user_roles
  SET analyses_used = analyses_used + 1
  WHERE user_id = _user_id;
END;
$$;

-- Update default monthly limit for free users (set to 3 if not already set)
UPDATE public.user_roles
SET monthly_analyses_limit = 3
WHERE role = 'free' AND monthly_analyses_limit = 0;