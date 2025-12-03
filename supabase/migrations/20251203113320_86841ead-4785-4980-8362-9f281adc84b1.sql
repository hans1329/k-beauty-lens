-- Add verification columns to challenge_applications
ALTER TABLE public.challenge_applications
ADD COLUMN verification_code TEXT,
ADD COLUMN is_verified BOOLEAN DEFAULT false;

-- Create function to generate verification code
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN 'LINKK_' || upper(substr(md5(random()::text), 1, 6));
END;
$$;