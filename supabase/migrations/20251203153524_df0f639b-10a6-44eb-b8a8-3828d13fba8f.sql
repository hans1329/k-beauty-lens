-- Add social media account columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tiktok_username text,
ADD COLUMN IF NOT EXISTS tiktok_id text,
ADD COLUMN IF NOT EXISTS tiktok_follower_count bigint,
ADD COLUMN IF NOT EXISTS tiktok_verified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS instagram_username text,
ADD COLUMN IF NOT EXISTS instagram_id text,
ADD COLUMN IF NOT EXISTS instagram_follower_count bigint,
ADD COLUMN IF NOT EXISTS instagram_verified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS youtube_channel_id text,
ADD COLUMN IF NOT EXISTS youtube_channel_name text,
ADD COLUMN IF NOT EXISTS youtube_subscriber_count bigint,
ADD COLUMN IF NOT EXISTS youtube_verified_at timestamp with time zone;