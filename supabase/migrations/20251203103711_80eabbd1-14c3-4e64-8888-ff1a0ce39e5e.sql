-- Add product detail URL column to challenges table
ALTER TABLE public.challenges 
ADD COLUMN product_detail_url text;