-- Add purchased_energy column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS purchased_energy INTEGER NOT NULL DEFAULT 0;

-- Create energy_purchases table to track purchase history
CREATE TABLE IF NOT EXISTS public.energy_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  energy_amount INTEGER NOT NULL,
  price_paid DECIMAL(10,2) NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  payment_method TEXT,
  transaction_id TEXT
);

-- Enable RLS
ALTER TABLE public.energy_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view their own purchases"
ON public.energy_purchases
FOR SELECT
USING (auth.uid() = user_id);

-- Only service role can insert purchases
CREATE POLICY "Service role can insert purchases"
ON public.energy_purchases
FOR INSERT
WITH CHECK (true);

-- Drop and recreate increment_quota_usage to use purchased energy after daily quota
DROP FUNCTION IF EXISTS public.increment_quota_usage(integer);

CREATE FUNCTION public.increment_quota_usage(quota_cost integer)
RETURNS TABLE(current_usage integer, quota_limit integer, is_exceeded boolean, used_purchased boolean)
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
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Get current daily usage
  SELECT COALESCE(quota_used, 0)
  INTO v_current_usage
  FROM public.api_quota_usage
  WHERE date = CURRENT_DATE;
  
  -- Check if daily quota is available
  IF v_current_usage + quota_cost <= v_quota_limit THEN
    -- Use daily quota
    INSERT INTO public.api_quota_usage (date, quota_used, quota_limit)
    VALUES (CURRENT_DATE, quota_cost, v_quota_limit)
    ON CONFLICT (date)
    DO UPDATE SET
      quota_used = api_quota_usage.quota_used + quota_cost,
      updated_at = now();
    
    v_current_usage := v_current_usage + quota_cost;
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

  RETURN QUERY SELECT v_current_usage, v_quota_limit, v_is_exceeded, v_used_purchased;
END;
$function$;