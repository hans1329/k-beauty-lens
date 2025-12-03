-- Add platform field to creators table
ALTER TABLE public.creators 
ADD COLUMN IF NOT EXISTS platform text NOT NULL DEFAULT 'youtube';

-- Add platform index for filtering
CREATE INDEX IF NOT EXISTS idx_creators_platform ON public.creators(platform);

-- Update existing creators to have youtube platform (already default, but explicit)
UPDATE public.creators SET platform = 'youtube' WHERE platform IS NULL OR platform = '';

-- Add constraint to ensure valid platform values
ALTER TABLE public.creators 
ADD CONSTRAINT creators_platform_check 
CHECK (platform IN ('youtube', 'tiktok', 'instagram'));