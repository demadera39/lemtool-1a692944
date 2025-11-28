-- Add new columns for monthly vs pack analyses tracking
ALTER TABLE public.user_roles
ADD COLUMN monthly_analyses_used INTEGER NOT NULL DEFAULT 0,
ADD COLUMN monthly_analyses_limit INTEGER NOT NULL DEFAULT 0,
ADD COLUMN pack_analyses_remaining INTEGER NOT NULL DEFAULT 0,
ADD COLUMN last_monthly_reset TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Migrate existing data: move current analyses_used to monthly for premium users
UPDATE public.user_roles
SET monthly_analyses_used = analyses_used,
    monthly_analyses_limit = CASE WHEN role = 'premium' THEN 10 ELSE 0 END
WHERE role = 'premium';

-- Create function to reset monthly analyses
CREATE OR REPLACE FUNCTION public.reset_monthly_analyses_if_needed(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_reset TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT last_monthly_reset INTO v_last_reset
  FROM public.user_roles
  WHERE user_id = _user_id;
  
  -- Reset if more than 30 days have passed
  IF v_last_reset IS NULL OR (now() - v_last_reset) > INTERVAL '30 days' THEN
    UPDATE public.user_roles
    SET monthly_analyses_used = 0,
        last_monthly_reset = now()
    WHERE user_id = _user_id;
  END IF;
END;
$$;

-- Update increment function to prioritize monthly analyses, then packs
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
  
  -- Prioritize monthly analyses if available
  IF v_role = 'premium' AND v_monthly_used < v_monthly_limit THEN
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