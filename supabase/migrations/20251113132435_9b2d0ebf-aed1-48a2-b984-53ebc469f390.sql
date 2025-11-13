-- Add a column to track if daily reward was claimed
ALTER TABLE public.energy_transactions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for faster reward lookups
CREATE INDEX IF NOT EXISTS idx_energy_transactions_user_type_date 
ON public.energy_transactions(user_id, transaction_type, created_at);

-- Drop and recreate the function with daily reward check
DROP FUNCTION IF EXISTS public.increment_quota_usage(integer);

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
  v_reward_given BOOLEAN := false;
  v_user_id UUID;
  v_purchased_energy INTEGER;
  v_reward_amount INTEGER;
  v_new_usage INTEGER;
  v_already_rewarded BOOLEAN;
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
    
    -- Check if user just completed daily quota (reached exactly 13) and hasn't received reward today
    IF v_current_usage = v_quota_limit THEN
      -- Check if reward was already given today
      SELECT EXISTS(
        SELECT 1 FROM public.energy_transactions
        WHERE user_id = v_user_id
          AND transaction_type = 'reward'
          AND created_at >= CURRENT_DATE
          AND created_at < CURRENT_DATE + INTERVAL '1 day'
      ) INTO v_already_rewarded;
      
      IF NOT v_already_rewarded THEN
        -- Get reward amount from settings
        SELECT setting_value INTO v_reward_amount
        FROM public.reward_settings
        WHERE setting_key = 'daily_completion_reward';
        
        -- Give reward
        IF v_reward_amount > 0 THEN
          UPDATE public.profiles
          SET purchased_energy = purchased_energy + v_reward_amount
          WHERE id = v_user_id;
          
          -- Record reward transaction
          INSERT INTO public.energy_transactions (user_id, transaction_type, amount, description, metadata)
          VALUES (v_user_id, 'reward', v_reward_amount, 'Daily completion reward', '{"date": "' || CURRENT_DATE || '"}'::jsonb);
          
          v_reward_given := true;
        END IF;
      END IF;
    END IF;
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

  RETURN QUERY SELECT v_current_usage, v_quota_limit, v_is_exceeded, v_used_purchased, v_reward_given;
END;
$function$;