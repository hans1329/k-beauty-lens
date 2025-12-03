-- Add current_applicants column to challenges table
ALTER TABLE public.challenges 
ADD COLUMN current_applicants integer NOT NULL DEFAULT 0;

-- Update existing counts
UPDATE public.challenges c
SET current_applicants = (
  SELECT COUNT(*) 
  FROM public.challenge_applications ca 
  WHERE ca.challenge_id = c.id
);

-- Create function to update applicant count
CREATE OR REPLACE FUNCTION public.update_challenge_applicant_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.challenges 
    SET current_applicants = current_applicants + 1 
    WHERE id = NEW.challenge_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.challenges 
    SET current_applicants = current_applicants - 1 
    WHERE id = OLD.challenge_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for auto-update
CREATE TRIGGER on_application_change
  AFTER INSERT OR DELETE ON public.challenge_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_challenge_applicant_count();