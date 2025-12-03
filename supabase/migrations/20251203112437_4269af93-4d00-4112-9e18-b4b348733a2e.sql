-- Add address column to profiles table for creators
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS address text;