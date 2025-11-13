-- Add unique constraints for upsert operations
ALTER TABLE public.brand_mentions 
ADD CONSTRAINT brand_mentions_video_brand_unique UNIQUE (video_id, brand_name);

ALTER TABLE public.video_keywords 
ADD CONSTRAINT video_keywords_video_keyword_unique UNIQUE (video_id, keyword);