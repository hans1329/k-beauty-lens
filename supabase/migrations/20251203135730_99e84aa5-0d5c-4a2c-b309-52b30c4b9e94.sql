-- Update increment_quota_usage function to remove reward logic
CREATE OR REPLACE FUNCTION public.increment_quota_usage(quota_cost integer)
 RETURNS TABLE(current_usage integer, quota_limit integer, is_exceeded boolean, used_purchased boolean, reward_given boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_usage INTEGER;
  v_quota_limit INTEGER := 13;
  v_is_exceeded BOOLEAN;
  v_used_purchased BOOLEAN := false;
  v_user_id UUID;
  v_purchased_energy INTEGER;
  v_new_usage INTEGER;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Get current daily usage
  SELECT COALESCE(quota_used, 0)
  INTO v_current_usage
  FROM public.api_quota_usage
  WHERE date = CURRENT_DATE;
  
  v_new_usage := v_current_usage + quota_cost;
  
  -- Check if daily quota is available
  IF v_new_usage <= v_quota_limit THEN
    -- Use daily quota
    INSERT INTO public.api_quota_usage (date, quota_used, quota_limit)
    VALUES (CURRENT_DATE, quota_cost, v_quota_limit)
    ON CONFLICT (date)
    DO UPDATE SET
      quota_used = api_quota_usage.quota_used + quota_cost,
      updated_at = now();
    
    -- Record the transaction
    INSERT INTO public.energy_transactions (user_id, transaction_type, amount, description)
    VALUES (v_user_id, 'used', -quota_cost, 'Energy used for search/activity');
    
    v_current_usage := v_new_usage;
    v_is_exceeded := false;
  ELSE
    -- Daily quota exceeded, try to use purchased energy
    SELECT purchased_energy INTO v_purchased_energy
    FROM public.profiles
    WHERE id = v_user_id;
    
    IF v_purchased_energy >= quota_cost THEN
      -- Use purchased energy
      UPDATE public.profiles
      SET purchased_energy = purchased_energy - quota_cost
      WHERE id = v_user_id;
      
      -- Record the transaction
      INSERT INTO public.energy_transactions (user_id, transaction_type, amount, description)
      VALUES (v_user_id, 'used', -quota_cost, 'Energy used from purchased balance');
      
      v_used_purchased := true;
      v_is_exceeded := false;
      
      -- Still update daily usage to max
      INSERT INTO public.api_quota_usage (date, quota_used, quota_limit)
      VALUES (CURRENT_DATE, v_quota_limit, v_quota_limit)
      ON CONFLICT (date)
      DO UPDATE SET
        quota_used = v_quota_limit,
        updated_at = now();
      
      v_current_usage := v_quota_limit;
    ELSE
      -- Both daily and purchased energy exhausted
      v_is_exceeded := true;
    END IF;
  END IF;

  -- Always return false for reward_given (reward system removed)
  RETURN QUERY SELECT v_current_usage, v_quota_limit, v_is_exceeded, v_used_purchased, false;
END;
$function$;