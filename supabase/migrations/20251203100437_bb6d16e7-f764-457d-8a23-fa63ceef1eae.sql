-- Drop the old check constraint and add 'bonus' type
ALTER TABLE public.energy_transactions 
DROP CONSTRAINT energy_transactions_transaction_type_check;

ALTER TABLE public.energy_transactions 
ADD CONSTRAINT energy_transactions_transaction_type_check 
CHECK (transaction_type = ANY (ARRAY['used'::text, 'reward'::text, 'purchase'::text, 'daily_reset'::text, 'bonus'::text]));