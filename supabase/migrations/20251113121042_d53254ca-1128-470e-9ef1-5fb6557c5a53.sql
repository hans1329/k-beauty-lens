-- Fix the increment_quota_usage function with proper variable naming
CREATE OR REPLACE FUNCTION public.increment_quota_usage(quota_cost integer)
RETURNS TABLE(current_usage integer, quota_limit integer, is_exceeded boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_usage INTEGER;
  v_quota_limit INTEGER := 3000;
  v_is_exceeded BOOLEAN;
BEGIN
  -- Insert or update today's quota usage
  INSERT INTO public.api_quota_usage (date, quota_used, quota_limit)
  VALUES (CURRENT_DATE, quota_cost, v_quota_limit)
  ON CONFLICT (date)
  DO UPDATE SET
    quota_used = api_quota_usage.quota_used + quota_cost,
    updated_at = now();

  -- Get current usage
  SELECT api_quota_usage.quota_used, api_quota_usage.quota_limit
  INTO v_current_usage, v_quota_limit
  FROM public.api_quota_usage
  WHERE api_quota_usage.date = CURRENT_DATE;

  v_is_exceeded := v_current_usage >= v_quota_limit;

  RETURN QUERY SELECT v_current_usage, v_quota_limit, v_is_exceeded;
END;
$function$;