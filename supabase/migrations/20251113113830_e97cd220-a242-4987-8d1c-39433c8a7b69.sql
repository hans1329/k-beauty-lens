-- Update RLS policy for creators deletion to allow only admins
DROP POLICY IF EXISTS "Allow public to delete creators" ON public.creators;

CREATE POLICY "Admins can delete creators"
ON public.creators
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));