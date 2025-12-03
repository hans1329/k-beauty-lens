-- Add user_id column to api_quota_usage for per-user tracking
ALTER TABLE public.api_quota_usage ADD COLUMN IF NOT EXISTS user_id uuid;

-- Create unique constraint for user + date combination
CREATE UNIQUE INDEX IF NOT EXISTS api_quota_usage_user_date_idx ON public.api_quota_usage (user_id, date);

-- Update increment_quota_usage function for per-user tracking
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
  
  -- Get current daily usage for THIS USER
  SELECT COALESCE(quota_used, 0)
  INTO v_current_usage
  FROM public.api_quota_usage
  WHERE date = CURRENT_DATE AND user_id = v_user_id;
  
  IF v_current_usage IS NULL THEN
    v_current_usage := 0;
  END IF;
  
  v_new_usage := v_current_usage + quota_cost;
  
  -- Check if daily quota is available
  IF v_new_usage <= v_quota_limit THEN
    -- Use daily quota - insert or update for THIS USER
    INSERT INTO public.api_quota_usage (date, quota_used, quota_limit, user_id)
    VALUES (CURRENT_DATE, v_new_usage, v_quota_limit, v_user_id)
    ON CONFLICT (user_id, date)
    DO UPDATE SET
      quota_used = EXCLUDED.quota_used,
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
      
      -- Update daily usage to max for THIS USER
      INSERT INTO public.api_quota_usage (date, quota_used, quota_limit, user_id)
      VALUES (CURRENT_DATE, v_quota_limit, v_quota_limit, v_user_id)
      ON CONFLICT (user_id, date)
      DO UPDATE SET
        quota_used = v_quota_limit,
        updated_at = now();
      
      v_current_usage := v_quota_limit;
    ELSE
      -- Both daily and purchased energy exhausted
      v_is_exceeded := true;
    END IF;
  END IF;

  RETURN QUERY SELECT v_current_usage, v_quota_limit, v_is_exceeded, v_used_purchased, false;
END;
$function$;