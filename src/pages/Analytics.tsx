import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Eye, ArrowLeft, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";

const Analytics = () => {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);
  
  const handleCreatorClick = async (customUrl: string) => {
    if (isNavigating) return;
    
    setIsNavigating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to view creator details");
        navigate("/auth");
        return;
      }

      const { data: result, error: quotaError } = await (supabase as any).rpc('increment_quota_usage', {
        quota_cost: 1
      });

      if (quotaError) {
        console.error('Quota error:', quotaError);
        toast.error("Failed to process energy");
        setIsNavigating(false);
        return;
      }

      if (result?.is_exceeded) {
        toast.error("All Energy Exhausted", {
          description: "Both daily and purchased energy depleted. Daily energy resets at midnight."
        });
        setIsNavigating(false);
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

      navigate(`/creator/${customUrl?.replace('@', '')}`);
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to navigate to creator page");
      setIsNavigating(false);
    }
  };
  
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["analytics-stats"],
    queryFn: async () => {
      const [creatorsRes, videosRes] = await Promise.all([
        supabase.from("creators").select("total_views, video_count"),
        supabase.from("videos").select("view_count, like_count, comment_count")
      ]);

      const totalCreators = creatorsRes.data?.length || 0;
      const totalViews = creatorsRes.data?.reduce((sum, c) => sum + (c.total_views || 0), 0) || 0;
      const totalVideos = creatorsRes.data?.reduce((sum, c) => sum + (c.video_count || 0), 0) || 0;
      
      const avgEngagement = videosRes.data?.length 
        ? videosRes.data.reduce((sum, v) => {
            const views = v.view_count || 1;
            const engagement = ((v.like_count || 0) + (v.comment_count || 0)) / views * 100;
            return sum + engagement;
          }, 0) / videosRes.data.length
        : 0;

      return {
        totalCreators,
        totalViews,
        totalVideos,
        avgEngagement: avgEngagement.toFixed(2)
      };
    }
  });

  const { data: topBySubscribers } = useQuery({
    queryKey: ["top-subscribers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("creators")
        .select("*")
        .order("subscriber_count", { ascending: false })
        .limit(10);
      return data || [];
    }
  });

  const { data: topByViews } = useQuery({
    queryKey: ["top-views"],
    queryFn: async () => {
      const { data } = await supabase
        .from("creators")
        .select("*")
        .order("total_views", { ascending: false })
        .limit(10);
      return data || [];
    }
  });

  const { data: topByContent } = useQuery({
    queryKey: ["top-content"],
    queryFn: async () => {
      const { data } = await supabase
        .from("creators")
        .select("*")
        .order("video_count", { ascending: false })
        .limit(10);
      return data || [];
    }
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const statCards = [
    {
      title: "Total Creators",
      value: stats?.totalCreators || 0,
      icon: Users,
    },
    {
      title: "Total Views",
      value: formatNumber(stats?.totalViews || 0),
      icon: Eye,
    },
    {
      title: "Total Videos",
      value: formatNumber(stats?.totalVideos || 0),
      icon: BarChart3,
    },
    {
      title: "Avg Engagement",
      value: `${stats?.avgEngagement || 0}%`,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto max-w-7xl px-6 py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="mb-4 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-4xl font-bold gradient-text">Analytics Dashboard</h1>
            <p className="text-muted-foreground text-lg">
              Track performance metrics and insights across all beauty creators
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {statsLoading ? "..." : stat.value}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Top Creators by Subscribers */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <CardTitle>Top Creators by Subscribers</CardTitle>
              </div>
              <CardDescription>Most followed beauty creators</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Rank</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead className="text-right">Subscribers</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topBySubscribers?.map((creator, index) => (
                    <TableRow key={creator.id}>
                      <TableCell>
                        <Badge variant={index < 3 ? "default" : "secondary"}>
                          #{index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={creator.thumbnail_url} />
                            <AvatarFallback>{creator.channel_name[0]}</AvatarFallback>
                          </Avatar>
                          <button 
                            onClick={() => handleCreatorClick(creator.custom_url)}
                            className="font-medium hover:text-primary transition-colors text-left"
                            disabled={isNavigating}
                          >
                            {creator.channel_name}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatNumber(creator.subscriber_count || 0)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatNumber(creator.total_views || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Top Creators by Views */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-500" />
                <CardTitle>Top Creators by Total Views</CardTitle>
              </div>
              <CardDescription>Most viewed beauty creators</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Rank</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead className="text-right">Total Views</TableHead>
                    <TableHead className="text-right">Videos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topByViews?.map((creator, index) => (
                    <TableRow key={creator.id}>
                      <TableCell>
                        <Badge variant={index < 3 ? "default" : "secondary"}>
                          #{index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={creator.thumbnail_url} />
                            <AvatarFallback>{creator.channel_name[0]}</AvatarFallback>
                          </Avatar>
                          <button 
                            onClick={() => handleCreatorClick(creator.custom_url)}
                            className="font-medium hover:text-primary transition-colors text-left"
                            disabled={isNavigating}
                          >
                            {creator.channel_name}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatNumber(creator.total_views || 0)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {creator.video_count || 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Top Creators by Content */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-500" />
                <CardTitle>Top Creators by Content Volume</CardTitle>
              </div>
              <CardDescription>Most prolific beauty creators</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Rank</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead className="text-right">Videos</TableHead>
                    <TableHead className="text-right">Subscribers</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topByContent?.map((creator, index) => (
                    <TableRow key={creator.id}>
                      <TableCell>
                        <Badge variant={index < 3 ? "default" : "secondary"}>
                          #{index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={creator.thumbnail_url} />
                            <AvatarFallback>{creator.channel_name[0]}</AvatarFallback>
                          </Avatar>
                          <button 
                            onClick={() => handleCreatorClick(creator.custom_url)}
                            className="font-medium hover:text-primary transition-colors text-left"
                            disabled={isNavigating}
                          >
                            {creator.channel_name}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {creator.video_count || 0}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatNumber(creator.subscriber_count || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
