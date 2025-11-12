-- Create creators table for YouTube channel information
CREATE TABLE public.creators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id TEXT NOT NULL UNIQUE,
  channel_name TEXT NOT NULL,
  subscriber_count BIGINT,
  total_views BIGINT,
  video_count INTEGER,
  description TEXT,
  thumbnail_url TEXT,
  country TEXT,
  custom_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create videos table
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  view_count BIGINT,
  like_count BIGINT,
  comment_count BIGINT,
  duration TEXT,
  thumbnail_url TEXT,
  tags TEXT[],
  category_id TEXT,
  caption_available BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create video_keywords table for extracted keywords
CREATE TABLE public.video_keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  keyword_type TEXT NOT NULL, -- 'product_category', 'brand', 'ingredient', 'technique', 'trend'
  confidence DECIMAL(3,2), -- 0.00 to 1.00
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create brand_mentions table
CREATE TABLE public.brand_mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  product_name TEXT,
  mention_count INTEGER DEFAULT 1,
  context TEXT,
  sentiment TEXT, -- 'positive', 'neutral', 'negative'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_creators_channel_id ON public.creators(channel_id);
CREATE INDEX idx_videos_creator_id ON public.videos(creator_id);
CREATE INDEX idx_videos_video_id ON public.videos(video_id);
CREATE INDEX idx_videos_published_at ON public.videos(published_at DESC);
CREATE INDEX idx_video_keywords_video_id ON public.video_keywords(video_id);
CREATE INDEX idx_video_keywords_keyword ON public.video_keywords(keyword);
CREATE INDEX idx_brand_mentions_video_id ON public.brand_mentions(video_id);
CREATE INDEX idx_brand_mentions_brand_name ON public.brand_mentions(brand_name);

-- Enable Row Level Security
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_mentions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
CREATE POLICY "Public read access for creators"
ON public.creators FOR SELECT
USING (true);

CREATE POLICY "Public read access for videos"
ON public.videos FOR SELECT
USING (true);

CREATE POLICY "Public read access for video_keywords"
ON public.video_keywords FOR SELECT
USING (true);

CREATE POLICY "Public read access for brand_mentions"
ON public.brand_mentions FOR SELECT
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_creators_updated_at
BEFORE UPDATE ON public.creators
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_videos_updated_at
BEFORE UPDATE ON public.videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();