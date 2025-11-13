import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, Users, Video, Eye, Heart, MessageSquare, Calendar } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OverviewMetrics {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalVideos: number;
  totalCreators: number;
  totalSubscribers: number;
  avgEngagementRate: number;
}

interface Creator {
  id: string;
  channel_name: string;
  subscriber_count: number;
  video_count: number;
  total_views: number;
  thumbnail_url: string;
}

interface Video {
  id: string;
  title: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  published_at: string;
  creator_id: string;
  creators: {
    channel_name: string;
  };
}

interface BrandMention {
  brand_name: string;
  mention_count: number;
  sentiment: string;
}

interface KeywordData {
  keyword: string;
  count: number;
  keyword_type: string;
}

interface CommentData {
  text_content: string;
  like_count: number;
  author_name: string;
  published_at: string;
}

interface TopQuestion {
  question: string;
  count: number;
}

const COLORS = ['#FF6B9D', '#C084FC', '#60A5FA', '#34D399', '#FBBF24', '#F87171'];

const AnalyticsAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [topCreators, setTopCreators] = useState<Creator[]>([]);
  const [topVideos, setTopVideos] = useState<Video[]>([]);
  const [brandMentions, setBrandMentions] = useState<BrandMention[]>([]);
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [topComments, setTopComments] = useState<CommentData[]>([]);
  const [topQuestions, setTopQuestions] = useState<TopQuestion[]>([]);
  const [timeRange, setTimeRange] = useState("30");

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - parseInt(timeRange));

      // Load overview metrics
      const [creatorsRes, videosRes] = await Promise.all([
        supabase.from('creators').select('*'),
        supabase.from('videos').select('*').gte('published_at', dateFilter.toISOString())
      ]);

      if (creatorsRes.data && videosRes.data) {
        const totalViews = videosRes.data.reduce((sum, v) => sum + (v.view_count || 0), 0);
        const totalLikes = videosRes.data.reduce((sum, v) => sum + (v.like_count || 0), 0);
        const totalComments = videosRes.data.reduce((sum, v) => sum + (v.comment_count || 0), 0);
        const totalSubscribers = creatorsRes.data.reduce((sum, c) => sum + (c.subscriber_count || 0), 0);
        
        const avgEngagement = videosRes.data.length > 0
          ? ((totalLikes + totalComments) / totalViews * 100)
          : 0;

        setMetrics({
          totalViews,
          totalLikes,
          totalComments,
          totalVideos: videosRes.data.length,
          totalCreators: creatorsRes.data.length,
          totalSubscribers,
          avgEngagementRate: avgEngagement
        });

        // Top creators by subscribers
        const sortedCreators = [...creatorsRes.data]
          .sort((a, b) => (b.subscriber_count || 0) - (a.subscriber_count || 0))
          .slice(0, 10);
        setTopCreators(sortedCreators);
      }

      // Top videos
      const topVidsRes = await supabase
        .from('videos')
        .select('*, creators(channel_name)')
        .gte('published_at', dateFilter.toISOString())
        .order('view_count', { ascending: false })
        .limit(10);

      if (topVidsRes.data) {
        setTopVideos(topVidsRes.data as any);
      }

      // Brand mentions
      const brandsRes = await supabase
        .from('brand_mentions')
        .select('brand_name, mention_count, sentiment');

      if (brandsRes.data) {
        const brandMap = new Map<string, { count: number; sentiment: string }>();
        brandsRes.data.forEach(b => {
          const existing = brandMap.get(b.brand_name);
          if (existing) {
            existing.count += b.mention_count || 1;
          } else {
            brandMap.set(b.brand_name, { count: b.mention_count || 1, sentiment: b.sentiment || 'neutral' });
          }
        });

        const brandData = Array.from(brandMap.entries())
          .map(([brand_name, data]) => ({
            brand_name,
            mention_count: data.count,
            sentiment: data.sentiment
          }))
          .sort((a, b) => b.mention_count - a.mention_count)
          .slice(0, 15);

        setBrandMentions(brandData);
      }

      // Keywords
      const keywordsRes = await supabase
        .from('video_keywords')
        .select('keyword, keyword_type');

      if (keywordsRes.data) {
        const keywordMap = new Map<string, { count: number; type: string }>();
        keywordsRes.data.forEach(k => {
          const existing = keywordMap.get(k.keyword);
          if (existing) {
            existing.count += 1;
          } else {
            keywordMap.set(k.keyword, { count: 1, type: k.keyword_type });
          }
        });

        const keywordData = Array.from(keywordMap.entries())
          .map(([keyword, data]) => ({
            keyword,
            count: data.count,
            keyword_type: data.type
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20);

        setKeywords(keywordData);
      }

      // Comments analysis
      const commentsRes = await supabase
        .from('comments')
        .select('text_content, like_count, author_name, published_at')
        .gte('published_at', dateFilter.toISOString())
        .order('like_count', { ascending: false })
        .limit(50);

      if (commentsRes.data) {
        setTopComments(commentsRes.data);

        // Extract questions (comments with '?')
        const questions = commentsRes.data
          .filter(c => c.text_content.includes('?'))
          .map(c => c.text_content);

        // Count similar questions (simple approach - exact match)
        const questionMap = new Map<string, number>();
        questions.forEach(q => {
          const normalized = q.toLowerCase().trim();
          questionMap.set(normalized, (questionMap.get(normalized) || 0) + 1);
        });

        const topQs = Array.from(questionMap.entries())
          .map(([question, count]) => ({ question, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        setTopQuestions(topQs);
      }

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'positive') return 'text-green-500';
    if (sentiment === 'negative') return 'text-red-500';
    return 'text-muted-foreground';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive insights and trends from creator data
            </p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Overview Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(metrics?.totalViews || 0)}</div>
              <p className="text-xs text-muted-foreground">
                Across {metrics?.totalVideos || 0} videos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(metrics?.totalSubscribers || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {metrics?.totalCreators || 0} creators
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.avgEngagementRate.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(metrics?.totalLikes || 0)} likes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comments</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(metrics?.totalComments || 0)}</div>
              <p className="text-xs text-muted-foreground">
                Avg {((metrics?.totalComments || 0) / (metrics?.totalVideos || 1)).toFixed(0)} per video
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Creators & Top Videos */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Creators</CardTitle>
              <CardDescription>By subscriber count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCreators.map((creator, idx) => (
                  <div key={creator.id} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 text-center font-bold text-muted-foreground">
                      #{idx + 1}
                    </div>
                    {creator.thumbnail_url && (
                      <img
                        src={creator.thumbnail_url}
                        alt={creator.channel_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{creator.channel_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatNumber(creator.subscriber_count)} subscribers • {creator.video_count} videos
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Videos</CardTitle>
              <CardDescription>Most viewed in selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topVideos.slice(0, 5).map((video, idx) => (
                  <div key={video.id} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 text-center font-bold text-muted-foreground">
                      #{idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{video.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {video.creators?.channel_name}
                      </p>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                        <span>{formatNumber(video.view_count)} views</span>
                        <span>{formatNumber(video.like_count)} likes</span>
                        <span>{formatNumber(video.comment_count)} comments</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Brand Mentions */}
        {brandMentions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Brand Mentions</CardTitle>
              <CardDescription>Top 15 most mentioned brands</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={brandMentions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="brand_name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="mention_count" fill="#FF6B9D" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Keywords Analysis */}
        {keywords.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Popular Keywords</CardTitle>
              <CardDescription>Top 20 keywords from video analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {keywords.map((kw, idx) => (
                  <div 
                    key={idx}
                    className="p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="font-medium truncate">{kw.keyword}</div>
                    <div className="text-sm text-muted-foreground">
                      {kw.count} mentions • {kw.keyword_type}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comments Analysis */}
        {topComments.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Questions</CardTitle>
                <CardDescription>Most frequently asked questions in comments</CardDescription>
              </CardHeader>
              <CardContent>
                {topQuestions.length > 0 ? (
                  <div className="space-y-3">
                    {topQuestions.map((q, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{q.question}</p>
                            {q.count > 1 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Asked {q.count} times
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No questions found in comments
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Comments</CardTitle>
                <CardDescription>Most liked comments across all videos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topComments.slice(0, 5).map((comment, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <div className="flex items-start gap-2 mb-2">
                        <div className="flex-shrink-0">
                          <Heart className="h-4 w-4 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{comment.author_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatNumber(comment.like_count)} likes
                          </p>
                        </div>
                      </div>
                      <p className="text-sm line-clamp-3">{comment.text_content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Video Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Video Performance Details</CardTitle>
            <CardDescription>Detailed metrics for top performing videos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Video Title</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Likes</TableHead>
                    <TableHead className="text-right">Comments</TableHead>
                    <TableHead className="text-right">Engagement</TableHead>
                    <TableHead>Published</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topVideos.map((video) => {
                    const engagement = ((video.like_count + video.comment_count) / video.view_count * 100);
                    return (
                      <TableRow key={video.id}>
                        <TableCell className="max-w-xs truncate font-medium">
                          {video.title}
                        </TableCell>
                        <TableCell>{video.creators?.channel_name}</TableCell>
                        <TableCell className="text-right">{formatNumber(video.view_count)}</TableCell>
                        <TableCell className="text-right">{formatNumber(video.like_count)}</TableCell>
                        <TableCell className="text-right">{formatNumber(video.comment_count)}</TableCell>
                        <TableCell className="text-right">{engagement.toFixed(2)}%</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(video.published_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AnalyticsAdmin;
