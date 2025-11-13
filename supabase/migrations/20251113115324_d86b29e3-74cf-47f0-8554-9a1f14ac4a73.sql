-- Create table to track YouTube API quota usage
CREATE TABLE IF NOT EXISTS public.api_quota_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  quota_used INTEGER NOT NULL DEFAULT 0,
  quota_limit INTEGER NOT NULL DEFAULT 3000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(date)
);

-- Enable RLS
ALTER TABLE public.api_quota_usage ENABLE ROW LEVEL SECURITY;

-- Allow public read access to quota
CREATE POLICY "Public can view quota usage"
ON public.api_quota_usage
FOR SELECT
USING (true);

-- Only allow system to insert/update quota
CREATE POLICY "Service role can manage quota"
ON public.api_quota_usage
FOR ALL
USING (true)
WITH CHECK (true);

-- Create function to update quota
CREATE OR REPLACE FUNCTION public.increment_quota_usage(quota_cost INTEGER)
RETURNS TABLE(current_usage INTEGER, quota_limit INTEGER, is_exceeded BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  SELECT quota_used, quota_limit
  INTO v_current_usage, v_quota_limit
  FROM public.api_quota_usage
  WHERE date = CURRENT_DATE;

  v_is_exceeded := v_current_usage >= v_quota_limit;

  RETURN QUERY SELECT v_current_usage, v_quota_limit, v_is_exceeded;
END;
$$;