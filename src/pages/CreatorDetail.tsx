import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, TrendingUp, Users, Eye, Heart, MessageCircle, Calendar, VideoIcon, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Creator {
  id: string;
  channel_id: string;
  channel_name: string;
  subscriber_count: number;
  video_count: number;
  total_views: number;
  description: string;
  thumbnail_url: string;
  country: string;
  custom_url: string;
  published_at: string;
  last_synced_at: string;
}

interface Video {
  id: string;
  video_id: string;
  title: string;
  description: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  published_at: string;
  thumbnail_url: string;
  duration: string;
}

interface BrandMention {
  brand_name: string;
  product_name: string;
  sentiment: string;
  mention_count: number;
  context: string;
}

interface VideoKeyword {
  keyword: string;
  keyword_type: string;
  confidence: number;
}

const CreatorDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [brandMentions, setBrandMentions] = useState<BrandMention[]>([]);
  const [keywords, setKeywords] = useState<VideoKeyword[]>([]);

  useEffect(() => {
    if (id) {
      loadCreatorData();
    }
  }, [id]);

  const loadCreatorData = async () => {
    try {
      setLoading(true);

      // Load creator info
      const { data: creatorData, error: creatorError } = await supabase
        .from('creators')
        .select('*')
        .eq('channel_id', id)
        .single();

      if (creatorError) throw creatorError;
      setCreator(creatorData);

      // Load videos
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .eq('creator_id', creatorData.id)
        .order('published_at', { ascending: false })
        .limit(50);

      if (videosError) throw videosError;
      setVideos(videosData || []);

      // Load brand mentions
      if (videosData && videosData.length > 0) {
        const videoIds = videosData.map(v => v.id);
        
        const { data: brandsData, error: brandsError } = await supabase
          .from('brand_mentions')
          .select('*')
          .in('video_id', videoIds);

        if (brandsError) throw brandsError;
        setBrandMentions(brandsData || []);

        // Load keywords
        const { data: keywordsData, error: keywordsError } = await supabase
          .from('video_keywords')
          .select('*')
          .in('video_id', videoIds);

        if (keywordsError) throw keywordsError;
        setKeywords(keywordsData || []);
      }
    } catch (error) {
      console.error('Error loading creator data:', error);
      toast.error('Failed to load creator data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <Navigation />
        <div className="container mx-auto max-w-7xl px-6 py-6">
          <p className="text-center text-muted-foreground">Creator not found</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const avgViews = videos.length > 0 
    ? Math.round(videos.reduce((sum, v) => sum + (v.view_count || 0), 0) / videos.length)
    : 0;

  const totalLikes = videos.reduce((sum, v) => sum + (v.like_count || 0), 0);
  const totalComments = videos.reduce((sum, v) => sum + (v.comment_count || 0), 0);

  // Aggregate brand mentions
  const brandStats = brandMentions.reduce((acc, mention) => {
    const existing = acc.find(b => b.name === mention.brand_name);
    if (existing) {
      existing.count += mention.mention_count;
    } else {
      acc.push({
        name: mention.brand_name,
        count: mention.mention_count,
        sentiment: mention.sentiment
      });
    }
    return acc;
  }, [] as Array<{ name: string; count: number; sentiment: string }>);

  const topBrands = brandStats
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Sentiment data
  const sentimentCounts = brandMentions.reduce((acc, m) => {
    acc[m.sentiment] = (acc[m.sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sentimentData = [
    { name: 'Positive', value: sentimentCounts['positive'] || 0, color: 'hsl(var(--chart-1))' },
    { name: 'Neutral', value: sentimentCounts['neutral'] || 0, color: 'hsl(var(--chart-2))' },
    { name: 'Negative', value: sentimentCounts['negative'] || 0, color: 'hsl(var(--chart-3))' },
  ];

  // Keyword aggregation
  const keywordStats = keywords.reduce((acc, kw) => {
    const existing = acc.find(k => k.keyword === kw.keyword);
    if (existing) {
      existing.count += 1;
      existing.avgConfidence = (existing.avgConfidence + (kw.confidence || 0)) / 2;
    } else {
      acc.push({
        keyword: kw.keyword,
        type: kw.keyword_type,
        count: 1,
        avgConfidence: kw.confidence || 0
      });
    }
    return acc;
  }, [] as Array<{ keyword: string; type: string; count: number; avgConfidence: number }>);

  const topKeywords = keywordStats
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const channelUrl = `https://youtube.com/channel/${creator.channel_id}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />

      <div className="container mx-auto max-w-7xl px-6 py-6 space-y-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-primary/20 shadow-elegant">
            <AvatarImage src={creator.thumbnail_url} alt={creator.channel_name} />
            <AvatarFallback>{creator.channel_name[0]}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-4">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold gradient-text">{creator.channel_name}</h1>
                <p className="text-muted-foreground text-lg">
                  {creator.custom_url 
                    ? (creator.custom_url.startsWith('@') ? creator.custom_url : `@${creator.custom_url}`)
                    : `@${creator.channel_name}`}
                </p>
                {creator.description && (
                  <p className="text-sm text-muted-foreground mt-2 max-w-2xl line-clamp-2">
                    {creator.description}
                  </p>
                )}
              </div>
              <a href={channelUrl} target="_blank" rel="noopener noreferrer">
                <Button className="rounded-full gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Visit Channel
                </Button>
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Subscribers
                </div>
                <div className="text-2xl font-bold">{formatNumber(creator.subscriber_count)}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  Total Views
                </div>
                <div className="text-2xl font-bold">{formatNumber(creator.total_views)}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  Avg Views
                </div>
                <div className="text-2xl font-bold">{formatNumber(avgViews)}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <VideoIcon className="h-4 w-4" />
                  Videos
                </div>
                <div className="text-2xl font-bold">{creator.video_count}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {creator.country && (
                <Badge variant="secondary" className="rounded-full">
                  {creator.country}
                </Badge>
              )}
              <Badge variant="outline" className="rounded-full gap-1">
                <Calendar className="h-3 w-3" />
                Joined {formatDate(creator.published_at)}
              </Badge>
              <Badge variant="outline" className="rounded-full">
                Last synced: {formatDate(creator.last_synced_at)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="videos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 rounded-full">
            <TabsTrigger value="videos" className="rounded-full">Videos</TabsTrigger>
            <TabsTrigger value="brands" className="rounded-full">Brands</TabsTrigger>
            <TabsTrigger value="keywords" className="rounded-full">Keywords</TabsTrigger>
            <TabsTrigger value="sentiment" className="rounded-full">Sentiment</TabsTrigger>
          </TabsList>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="border-border/50 backdrop-blur-sm bg-card/80">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Recent Videos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{videos.length}</div>
                </CardContent>
              </Card>
              <Card className="border-border/50 backdrop-blur-sm bg-card/80">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Likes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatNumber(totalLikes)}</div>
                </CardContent>
              </Card>
              <Card className="border-border/50 backdrop-blur-sm bg-card/80">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatNumber(totalComments)}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/50 backdrop-blur-sm bg-card/80">
              <CardHeader>
                <CardTitle>Recent Videos</CardTitle>
                <CardDescription>Latest {videos.length} videos from this creator</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {videos.slice(0, 10).map((video) => (
                    <div key={video.id} className="flex gap-4 p-4 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors">
                      <img 
                        src={video.thumbnail_url} 
                        alt={video.title}
                        className="w-40 h-24 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-2 line-clamp-2">{video.title}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {formatNumber(video.view_count)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {formatNumber(video.like_count)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {formatNumber(video.comment_count)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(video.published_at)}
                          </span>
                        </div>
                      </div>
                      <a 
                        href={`https://youtube.com/watch?v=${video.video_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0"
                      >
                        <Button variant="ghost" size="icon" className="rounded-full">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Brands Tab */}
          <TabsContent value="brands" className="space-y-6">
            <Card className="border-border/50 backdrop-blur-sm bg-card/80">
              <CardHeader>
                <CardTitle>Top Brand Mentions</CardTitle>
                <CardDescription>Most frequently mentioned brands across videos</CardDescription>
              </CardHeader>
              <CardContent>
                {topBrands.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No brand data available</p>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {topBrands.map((brand, index) => (
                        <div key={brand.name} className="flex items-center gap-4">
                          <div className="text-2xl font-bold text-muted-foreground w-8">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold">{brand.name}</span>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={brand.sentiment === 'positive' ? 'default' : brand.sentiment === 'negative' ? 'destructive' : 'secondary'}
                                  className="rounded-full"
                                >
                                  {brand.sentiment}
                                </Badge>
                                <span className="text-sm font-semibold">{brand.count} mentions</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={topBrands.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="name" 
                          stroke="hsl(var(--muted-foreground))"
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50 backdrop-blur-sm bg-card/80">
              <CardHeader>
                <CardTitle>Brand Context Examples</CardTitle>
                <CardDescription>How brands are mentioned in videos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {brandMentions.slice(0, 10).map((mention, index) => (
                    <div key={index} className="p-4 rounded-lg border border-border/50 bg-accent/20">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{mention.brand_name}</h4>
                        <Badge variant="outline" className="rounded-full">
                          {mention.sentiment}
                        </Badge>
                      </div>
                      {mention.product_name && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Product: {mention.product_name}
                        </p>
                      )}
                      {mention.context && (
                        <p className="text-sm line-clamp-3">{mention.context}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Keywords Tab */}
          <TabsContent value="keywords" className="space-y-6">
            <Card className="border-border/50 backdrop-blur-sm bg-card/80">
              <CardHeader>
                <CardTitle>Top Keywords</CardTitle>
                <CardDescription>Most common keywords across videos</CardDescription>
              </CardHeader>
              <CardContent>
                {topKeywords.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No keyword data available</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {topKeywords.map((kw, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="rounded-full text-sm py-2 px-4"
                      >
                        {kw.keyword} ({kw.count})
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {topKeywords.length > 0 && (
              <Card className="border-border/50 backdrop-blur-sm bg-card/80">
                <CardHeader>
                  <CardTitle>Keyword Distribution</CardTitle>
                  <CardDescription>Frequency of top keywords</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={topKeywords.slice(0, 15)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                      <YAxis 
                        type="category" 
                        dataKey="keyword" 
                        stroke="hsl(var(--muted-foreground))"
                        width={150}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Sentiment Tab */}
          <TabsContent value="sentiment" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/50 backdrop-blur-sm bg-card/80">
                <CardHeader>
                  <CardTitle>Brand Sentiment Distribution</CardTitle>
                  <CardDescription>Overall sentiment in brand mentions</CardDescription>
                </CardHeader>
                <CardContent>
                  {sentimentData.every(s => s.value === 0) ? (
                    <p className="text-center text-muted-foreground py-8">No sentiment data available</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={sentimentData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {sentimentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/50 backdrop-blur-sm bg-card/80">
                <CardHeader>
                  <CardTitle>Sentiment Statistics</CardTitle>
                  <CardDescription>Breakdown of brand sentiment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {sentimentData.map((sentiment) => (
                    <div key={sentiment.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{sentiment.name}</span>
                        <span className="text-2xl font-bold">{sentiment.value}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all"
                          style={{ 
                            width: `${(sentiment.value / brandMentions.length) * 100}%`,
                            backgroundColor: sentiment.color 
                          }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {brandMentions.length > 0 
                          ? `${((sentiment.value / brandMentions.length) * 100).toFixed(1)}%` 
                          : '0%'
                        } of all brand mentions
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="mt-12 pt-8 pb-6 border-t border-border/50">
          <div className="space-y-6">
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <a 
                href="/privacy" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy
              </a>
              <a 
                href="/terms" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms
              </a>
              <a 
                href="/contact" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact
              </a>
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Fantagram Inc. © 2025. All rights reserved.
              </p>
              <p className="text-xs text-muted-foreground">
                131 Continental Dr. Suite 305, City of Newark, DE 19713 U.S.A.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default CreatorDetail;
