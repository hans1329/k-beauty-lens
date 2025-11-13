-- Create user_searches table to track user search history
CREATE TABLE public.user_searches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id text NOT NULL,
  channel_name text NOT NULL,
  channel_thumbnail text,
  searched_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_searches ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own searches" 
ON public.user_searches 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own searches" 
ON public.user_searches 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own searches" 
ON public.user_searches 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_user_searches_user_id ON public.user_searches(user_id);
CREATE INDEX idx_user_searches_searched_at ON public.user_searches(searched_at DESC);