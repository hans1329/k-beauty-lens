import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Calendar, Eye, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChannelData {
  channel_id: string;
  channel_name: string;
  channel_handle: string;
  subscriber_count: number;
  total_views: number;
  video_count: number;
  profile_image_url: string;
}

interface VideoData {
  video_id: string;
  title: string;
  published_at: string;
  view_count: number;
  like_count: number;
  thumbnail_url: string;
}

const AnalysisResult = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [channelData, setChannelData] = useState<ChannelData | null>(null);
  const [videos, setVideos] = useState<VideoData[]>([]);

  useEffect(() => {
    if (!channelId) {
      navigate("/");
      return;
    }

    loadAnalysisData();
  }, [channelId]);

  const loadAnalysisData = async () => {
    try {
      setLoading(true);

      // Temporary mock data until database tables are set up
      setChannelData({
        channel_id: channelId || "",
        channel_name: "Sample Channel",
        channel_handle: "@samplechannel",
        subscriber_count: 100000,
        total_views: 1000000,
        video_count: 50,
        profile_image_url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158"
      });

      setVideos([]);
      
      toast.success("Analysis completed successfully!");
    } catch (error) {
      console.error("Error loading analysis data:", error);
      toast.error("Failed to load analysis results");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 w-full mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!channelData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">No data found</h2>
          <Button asChild className="rounded-full">
            <Link to="/">Go back home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 gap-2 rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to search
        </Button>

        {/* Channel Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <img
                src={channelData.profile_image_url}
                alt={channelData.channel_name}
                className="w-24 h-24 rounded-full"
              />
              <div className="flex-1 space-y-3">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    {channelData.channel_name}
                  </h1>
                  <p className="text-muted-foreground">
                    {channelData.channel_handle}
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Badge variant="secondary" className="gap-2">
                    <Eye className="h-4 w-4" />
                    {channelData.subscriber_count?.toLocaleString()} subscribers
                  </Badge>
                  <Badge variant="secondary" className="gap-2">
                    <ThumbsUp className="h-4 w-4" />
                    {channelData.total_views?.toLocaleString()} views
                  </Badge>
                  <Badge variant="secondary">
                    {channelData.video_count} videos
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Videos */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.map((video) => (
                <Card key={video.video_id} className="overflow-hidden">
                  <div className="aspect-video relative">
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(video.published_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {video.view_count?.toLocaleString()}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-full gap-2"
                      asChild
                    >
                      <a
                        href={`https://www.youtube.com/watch?v=${video.video_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Watch on YouTube
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalysisResult;
