import { BarChart3, TrendingUp, Users, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const StatsSection = () => {
  const { data: creatorCount } = useQuery({
    queryKey: ["creator-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("creators")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: totalReach } = useQuery({
    queryKey: ["total-reach"],
    queryFn: async () => {
      const { data } = await supabase
        .from("creators")
        .select("total_views");
      const total = data?.reduce((sum, creator) => sum + (creator.total_views || 0), 0) || 0;
      return total;
    },
  });

  const { data: avgEngagement } = useQuery({
    queryKey: ["avg-engagement"],
    queryFn: async () => {
      const { data } = await supabase
        .from("videos")
        .select("view_count, like_count, comment_count");
      
      if (!data || data.length === 0) return 0;
      
      const totalEngagement = data.reduce((sum, video) => {
        const views = video.view_count || 0;
        const engagement = (video.like_count || 0) + (video.comment_count || 0);
        return sum + (views > 0 ? (engagement / views) : 0);
      }, 0);
      
      return ((totalEngagement / data.length) * 100).toFixed(1);
    },
  });

  const { data: analysisCount } = useQuery({
    queryKey: ["analysis-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("thumbnail_analysis")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const stats = [
    {
      icon: Users,
      label: "Total Creators",
      value: creatorCount?.toLocaleString() || "0",
      change: "Active creators",
      color: "text-primary",
    },
    {
      icon: TrendingUp,
      label: "Avg. Engagement",
      value: `${avgEngagement || "0"}%`,
      change: "Likes + Comments / Views",
      color: "text-secondary",
    },
    {
      icon: BarChart3,
      label: "Total Reach",
      value: formatNumber(totalReach || 0),
      change: "Total views",
      color: "text-accent",
    },
    {
      icon: Zap,
      label: "AI Analyses",
      value: analysisCount?.toLocaleString() || "0",
      change: "Updated daily",
      color: "text-primary",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="glass border-border/50 p-6 hover:shadow-card transition-all duration-300"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </div>
            <div className={`p-3 rounded-xl bg-muted/50 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default StatsSection;
