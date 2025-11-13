-- Add DELETE policy for creators table
CREATE POLICY "Allow public to delete creators"
ON public.creators
FOR DELETE
TO public
USING (true);

-- Add INSERT policy for creators table (if needed for admin operations)
CREATE POLICY "Allow public to insert creators"
ON public.creators
FOR INSERT
TO public
WITH CHECK (true);

-- Add UPDATE policy for creators table (for syncing updates)
CREATE POLICY "Allow public to update creators"
ON public.creators
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);