-- Add is_visible column to creators table
ALTER TABLE public.creators 
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_creators_visible ON public.creators(is_visible);

-- Add RLS policy for admins to update visibility
CREATE POLICY "Admins can update creator visibility"
ON public.creators
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));