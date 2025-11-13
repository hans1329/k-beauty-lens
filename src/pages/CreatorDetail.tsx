import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, TrendingUp, Users, Eye, Heart, MessageCircle, Calendar, VideoIcon, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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

const translations = {
  en: {
    visitChannel: "Visit Channel",
    subscribers: "Subscribers",
    totalViews: "Total Views",
    avgViews: "Avg Views",
    videos: "Videos",
    joined: "Joined",
    lastSynced: "Last synced",
    videosTab: "Videos",
    brandsTab: "Brands",
    keywordsTab: "Keywords",
    sentimentTab: "Sentiment",
    recentVideos: "Recent Videos",
    totalLikes: "Total Likes",
    totalComments: "Total Comments",
    latestVideos: "Latest {count} videos from this creator",
    topBrandMentions: "Top Brand Mentions",
    frequentBrands: "Most frequently mentioned brands across videos",
    mentions: "mentions",
    brandContextExamples: "Brand Context Examples",
    howBrandsMentioned: "How brands are mentioned in videos",
    product: "Product",
    topKeywords: "Top Keywords",
    commonKeywords: "Most common keywords across videos",
    noKeywordData: "No keyword data available",
    brandSentimentDist: "Brand Sentiment Distribution",
    overallSentiment: "Overall sentiment in brand mentions",
    noSentimentData: "No sentiment data available",
    sentimentStats: "Sentiment Statistics",
    sentimentBreakdown: "Breakdown of brand sentiment",
    ofAllMentions: "of all mentions",
    creatorNotFound: "Creator not found"
  },
  ko: {
    visitChannel: "채널 방문",
    subscribers: "구독자",
    totalViews: "총 조회수",
    avgViews: "평균 조회수",
    videos: "영상",
    joined: "가입일",
    lastSynced: "마지막 동기화",
    videosTab: "영상",
    brandsTab: "브랜드",
    keywordsTab: "키워드",
    sentimentTab: "감정 분석",
    recentVideos: "최근 영상",
    totalLikes: "총 좋아요",
    totalComments: "총 댓글",
    latestVideos: "이 크리에이터의 최근 {count}개 영상",
    topBrandMentions: "주요 브랜드 언급",
    frequentBrands: "영상에서 가장 자주 언급된 브랜드",
    mentions: "회 언급",
    brandContextExamples: "브랜드 맥락 예시",
    howBrandsMentioned: "영상에서 브랜드가 언급된 방식",
    product: "제품",
    topKeywords: "주요 키워드",
    commonKeywords: "영상에서 가장 많이 사용된 키워드",
    noKeywordData: "키워드 데이터가 없습니다",
    brandSentimentDist: "브랜드 감정 분포",
    overallSentiment: "브랜드 언급의 전반적인 감정",
    noSentimentData: "감정 데이터가 없습니다",
    sentimentStats: "감정 통계",
    sentimentBreakdown: "브랜드 감정 분석",
    ofAllMentions: "전체 언급 중",
    creatorNotFound: "크리에이터를 찾을 수 없습니다"
  }
};

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
  const [isEnglish, setIsEnglish] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedVideos, setTranslatedVideos] = useState<Video[]>([]);
  const [translatedBrands, setTranslatedBrands] = useState<BrandMention[]>([]);
  const [visibleVideosCount, setVisibleVideosCount] = useState(10);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const t = isEnglish ? translations.en : translations.ko;
  const displayVideos = isEnglish && translatedVideos.length > 0 ? translatedVideos : videos;
  const displayBrands = isEnglish && translatedBrands.length > 0 ? translatedBrands : brandMentions;

  useEffect(() => {
    if (id) {
      loadCreatorData();
      deductVisitEnergy();
    }
    checkAdminStatus();
  }, [id]);

  const deductVisitEnergy = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const { data: energyCost } = await supabase
        .from('energy_costs' as any)
        .select('cost')
        .eq('action_type', 'visit_creator')
        .single();
      
      const cost = (energyCost as any)?.cost || 1;
      const { data: quotaResult, error: quotaError } = await (supabase as any)
        .rpc('increment_quota_usage', { quota_cost: cost });
      
      if (quotaError) throw quotaError;
      
      const result = quotaResult?.[0];
      
      if (result?.is_exceeded) {
        toast.error("All Energy Exhausted", {
          description: "Both daily and purchased energy depleted. Daily energy resets at midnight."
        });
        return;
      }
      
      // Show reward notification if given
      if (result?.reward_given) {
        const { data: rewardSetting } = await (supabase as any)
          .from('reward_settings')
          .select('setting_value')
          .eq('setting_key', 'daily_completion_reward')
          .single();
        
        const rewardAmount = rewardSetting?.setting_value || 5;
        toast.success("Daily Quest Complete!", {
          description: `You've earned ${rewardAmount} bonus energy for completing your daily quota!`
        });
      }
      
      // Show energy consumption notification
      const remaining = result?.quota_limit - result?.current_usage;
      const energyType = result?.used_purchased ? "Purchased Energy" : "Daily Energy";
      toast.info(`${cost} ${energyType} Consumed`, {
        description: `${remaining} daily energy remaining`
      });
    } catch (error) {
      console.error("Error deducting visit energy:", error);
    }
  };

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsAdmin(false);
      return;
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    setIsAdmin(!!roleData);
  };

  const handleDeleteCreator = async () => {
    if (!creator) return;
    
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('creators')
        .delete()
        .eq('id', creator.id);

      if (error) throw error;

      toast.success('Creator deleted successfully');
      navigate('/');
    } catch (error) {
      console.error('Error deleting creator:', error);
      toast.error('Failed to delete creator');
    } finally {
      setIsDeleting(false);
    }
  };

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
          <p className="text-center text-muted-foreground">{t.creatorNotFound}</p>
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

  const translateContent = async (targetLang: string) => {
    if (isTranslating) return;
    
    setIsTranslating(true);
    try {
      // Collect all texts to translate
      const videoTitles = videos.map(v => v.title);
      const videoDescriptions = videos.map(v => v.description || '');
      const brandNames = brandMentions.map(b => b.brand_name);
      const brandProducts = brandMentions.map(b => b.product_name || '');
      const brandContexts = brandMentions.map(b => b.context || '');

      const allTexts = [
        ...videoTitles,
        ...videoDescriptions,
        ...brandNames,
        ...brandProducts,
        ...brandContexts
      ].filter(text => text && text.trim().length > 0);

      const { data, error } = await supabase.functions.invoke('translate-content', {
        body: { texts: allTexts, targetLanguage: targetLang }
      });

      if (error) throw error;

      const translations = data.translations;
      let idx = 0;

      // Apply translations to videos
      const newVideos = videos.map(video => ({
        ...video,
        title: translations[idx++] || video.title,
        description: translations[idx++] || video.description
      }));

      // Apply translations to brands
      const newBrands = brandMentions.map(brand => ({
        ...brand,
        brand_name: translations[idx++] || brand.brand_name,
        product_name: translations[idx++] || brand.product_name,
        context: translations[idx++] || brand.context
      }));

      setTranslatedVideos(newVideos);
      setTranslatedBrands(newBrands);
      toast.success('Translation completed');
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleLanguageToggle = () => {
    const newLang = !isEnglish;
    setIsEnglish(newLang);
    
    if (newLang && translatedVideos.length === 0) {
      translateContent('en');
    }
  };

  const channelUrl = `https://youtube.com/channel/${creator.channel_id}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />

      <div className="container mx-auto max-w-7xl px-6 py-6 space-y-6">
        {/* Back Button and Language Toggle */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            onClick={handleLanguageToggle}
            disabled={isTranslating}
            className="rounded-full"
          >
            {isTranslating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              isEnglish ? 'KOR' : 'ENG'
            )}
          </Button>
        </div>

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
              <div className="flex gap-2">
                <a href={channelUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="rounded-full gap-2">
                    <ExternalLink className="h-4 w-4" />
                    {t.visitChannel}
                  </Button>
                </a>
                {isAdmin && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="icon"
                        className="rounded-full"
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Creator</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this creator? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteCreator}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {t.subscribers}
                </div>
                <div className="text-2xl font-bold">{formatNumber(creator.subscriber_count)}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  {t.totalViews}
                </div>
                <div className="text-2xl font-bold">{formatNumber(creator.total_views)}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  {t.avgViews}
                </div>
                <div className="text-2xl font-bold">{formatNumber(avgViews)}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <VideoIcon className="h-4 w-4" />
                  {t.videos}
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
                {t.joined} {formatDate(creator.published_at)}
              </Badge>
              <Badge variant="outline" className="rounded-full">
                {t.lastSynced}: {formatDate(creator.last_synced_at)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="videos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 rounded-full">
            <TabsTrigger value="videos" className="rounded-full">{t.videosTab}</TabsTrigger>
            <TabsTrigger value="brands" className="rounded-full">{t.brandsTab}</TabsTrigger>
            <TabsTrigger value="keywords" className="rounded-full">{t.keywordsTab}</TabsTrigger>
            <TabsTrigger value="sentiment" className="rounded-full">{t.sentimentTab}</TabsTrigger>
          </TabsList>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="border-border/50 backdrop-blur-sm bg-card/80">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{t.recentVideos}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{videos.length}</div>
                </CardContent>
              </Card>
              <Card className="border-border/50 backdrop-blur-sm bg-card/80">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{t.totalLikes}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatNumber(totalLikes)}</div>
                </CardContent>
              </Card>
              <Card className="border-border/50 backdrop-blur-sm bg-card/80">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{t.totalComments}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatNumber(totalComments)}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/50 backdrop-blur-sm bg-card/80">
              <CardHeader>
                <CardTitle>{t.recentVideos}</CardTitle>
                <CardDescription>{t.latestVideos.replace('{count}', videos.length.toString())}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {displayVideos.slice(0, visibleVideosCount).map((video) => (
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
                {displayVideos.length > visibleVideosCount && (
                  <div className="flex justify-center mt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => setVisibleVideosCount(prev => prev + 10)}
                      className="rounded-full"
                    >
                      Load More Videos
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Brands Tab */}
          <TabsContent value="brands" className="space-y-6">
            <Card className="border-border/50 backdrop-blur-sm bg-card/80">
              <CardHeader>
                <CardTitle>{t.topBrandMentions}</CardTitle>
                <CardDescription>{t.frequentBrands}</CardDescription>
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
                                <span className="text-sm font-semibold">{brand.count} {t.mentions}</span>
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
                <CardTitle>{t.brandContextExamples}</CardTitle>
                <CardDescription>{t.howBrandsMentioned}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {displayBrands.slice(0, 10).map((mention, index) => (
                    <div key={index} className="p-4 rounded-lg border border-border/50 bg-accent/20">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{mention.brand_name}</h4>
                        <Badge variant="outline" className="rounded-full">
                          {mention.sentiment}
                        </Badge>
                      </div>
                      {mention.product_name && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {t.product}: {mention.product_name}
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
                <CardTitle>{t.topKeywords}</CardTitle>
                <CardDescription>{t.commonKeywords}</CardDescription>
              </CardHeader>
              <CardContent>
                {topKeywords.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">{t.noKeywordData}</p>
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
                  <CardTitle>{t.brandSentimentDist}</CardTitle>
                  <CardDescription>{t.overallSentiment}</CardDescription>
                </CardHeader>
                <CardContent>
                  {sentimentData.every(s => s.value === 0) ? (
                    <p className="text-center text-muted-foreground py-8">{t.noSentimentData}</p>
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
                  <CardTitle>{t.sentimentStats}</CardTitle>
                  <CardDescription>{t.sentimentBreakdown}</CardDescription>
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
                        } {t.ofAllMentions}
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
                href="mailto:manager@fantagram.ai" 
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
