-- Create function to increment analysis count
CREATE OR REPLACE FUNCTION public.increment_analysis_count(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_roles
  SET analyses_used = analyses_used + 1
  WHERE user_id = _user_id;
END;
$$;