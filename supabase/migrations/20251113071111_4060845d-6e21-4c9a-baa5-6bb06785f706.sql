-- Create comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  comment_id TEXT NOT NULL UNIQUE,
  author_name TEXT,
  text_content TEXT NOT NULL,
  like_count BIGINT DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create thumbnail_analysis table
CREATE TABLE public.thumbnail_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE UNIQUE,
  thumbnail_url TEXT NOT NULL,
  brightness FLOAT,
  contrast FLOAT,
  color_temp INTEGER,
  dominant_colors JSONB,
  style_tags JSONB,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thumbnail_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public read access for comments"
ON public.comments
FOR SELECT
USING (true);

CREATE POLICY "Public read access for thumbnail_analysis"
ON public.thumbnail_analysis
FOR SELECT
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_comments_video_id ON public.comments(video_id);
CREATE INDEX idx_comments_published_at ON public.comments(published_at);
CREATE INDEX idx_thumbnail_analysis_video_id ON public.thumbnail_analysis(video_id);

-- Add trigger for updated_at
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();