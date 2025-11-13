-- Create energy costs configuration table
CREATE TABLE IF NOT EXISTS public.energy_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL UNIQUE,
  cost INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.energy_costs ENABLE ROW LEVEL SECURITY;

-- Public can view energy costs
CREATE POLICY "Public can view energy costs"
ON public.energy_costs
FOR SELECT
USING (true);

-- Only admins can manage energy costs
CREATE POLICY "Admins can manage energy costs"
ON public.energy_costs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default energy costs
INSERT INTO public.energy_costs (action_type, cost, description)
VALUES 
  ('search', 1, 'Energy cost for searching a creator'),
  ('visit_creator', 1, 'Energy cost for visiting a creator page')
ON CONFLICT (action_type) DO NOTHING;

-- Update increment_quota_usage function to use new quota limit of 13
CREATE OR REPLACE FUNCTION public.increment_quota_usage(quota_cost integer)
RETURNS TABLE(current_usage integer, quota_limit integer, is_exceeded boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_usage INTEGER;
  v_quota_limit INTEGER := 13;
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

-- Add trigger for updated_at
CREATE TRIGGER update_energy_costs_updated_at
  BEFORE UPDATE ON public.energy_costs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();