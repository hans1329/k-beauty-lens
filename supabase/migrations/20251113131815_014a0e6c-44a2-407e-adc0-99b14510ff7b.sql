-- Create reward settings table
CREATE TABLE public.reward_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reward_settings ENABLE ROW LEVEL SECURITY;

-- Public can view reward settings
CREATE POLICY "Public can view reward settings"
ON public.reward_settings
FOR SELECT
USING (true);

-- Admins can manage reward settings
CREATE POLICY "Admins can manage reward settings"
ON public.reward_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default daily completion reward
INSERT INTO public.reward_settings (setting_key, setting_value, description)
VALUES ('daily_completion_reward', 5, 'Energy reward for completing daily quota');

-- Create energy transactions table for tracking all energy movements
CREATE TABLE public.energy_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('used', 'reward', 'purchase', 'daily_reset')),
  amount INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.energy_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
ON public.energy_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Service role can insert transactions
CREATE POLICY "Service role can insert transactions"
ON public.energy_transactions
FOR INSERT
WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX idx_energy_transactions_user_id ON public.energy_transactions(user_id);
CREATE INDEX idx_energy_transactions_created_at ON public.energy_transactions(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_reward_settings_updated_at
BEFORE UPDATE ON public.reward_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();