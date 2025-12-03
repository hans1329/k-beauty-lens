-- Create challenges table (brands register products)
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  product_name TEXT NOT NULL,
  product_image_url TEXT,
  product_value INTEGER, -- product value in KRW
  max_applicants INTEGER DEFAULT 10,
  platform TEXT[] DEFAULT ARRAY['instagram', 'tiktok'],
  requirements TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'closed', 'completed')),
  application_deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create challenge applications table (creators apply)
CREATE TABLE public.challenge_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'selected', 'rejected', 'shipped', 'submitted', 'completed')),
  social_handle TEXT,
  social_platform TEXT,
  follower_count INTEGER,
  message TEXT,
  shipping_address TEXT,
  content_url TEXT, -- URL to the posted content
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, creator_id)
);

-- Enable RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_applications ENABLE ROW LEVEL SECURITY;

-- Challenges policies
CREATE POLICY "Anyone can view open challenges"
ON public.challenges FOR SELECT
USING (status = 'open' OR brand_id = auth.uid());

CREATE POLICY "Brands can create challenges"
ON public.challenges FOR INSERT
WITH CHECK (auth.uid() = brand_id);

CREATE POLICY "Brands can update own challenges"
ON public.challenges FOR UPDATE
USING (auth.uid() = brand_id);

CREATE POLICY "Brands can delete own challenges"
ON public.challenges FOR DELETE
USING (auth.uid() = brand_id);

-- Applications policies
CREATE POLICY "Creators can view own applications"
ON public.challenge_applications FOR SELECT
USING (creator_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.challenges WHERE id = challenge_id AND brand_id = auth.uid()
));

CREATE POLICY "Creators can apply to challenges"
ON public.challenge_applications FOR INSERT
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update own applications"
ON public.challenge_applications FOR UPDATE
USING (creator_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.challenges WHERE id = challenge_id AND brand_id = auth.uid()
));

-- Triggers for updated_at
CREATE TRIGGER update_challenges_updated_at
BEFORE UPDATE ON public.challenges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_challenge_applications_updated_at
BEFORE UPDATE ON public.challenge_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();