import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/AdminLayout";
import { Users, Video, TrendingUp, Activity } from "lucide-react";

interface Stats {
  totalCreators: number;
  totalVideos: number;
  totalSubscribers: number;
  totalViews: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalCreators: 0,
    totalVideos: 0,
    totalSubscribers: 0,
    totalViews: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: creators } = await supabase
        .from('creators')
        .select('subscriber_count, video_count, total_views');

      const { count: videoCount } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true });

      if (creators) {
        const totalSubscribers = creators.reduce((sum, c) => sum + c.subscriber_count, 0);
        const totalViews = creators.reduce((sum, c) => sum + c.total_views, 0);
        
        setStats({
          totalCreators: creators.length,
          totalVideos: videoCount || 0,
          totalSubscribers,
          totalViews,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Creators",
      value: stats.totalCreators.toLocaleString(),
      icon: Users,
      description: "YouTube channels synced",
    },
    {
      title: "Total Videos",
      value: stats.totalVideos.toLocaleString(),
      icon: Video,
      description: "Videos in database",
    },
    {
      title: "Total Subscribers",
      value: stats.totalSubscribers.toLocaleString(),
      icon: TrendingUp,
      description: "Across all creators",
    },
    {
      title: "Total Views",
      value: stats.totalViews.toLocaleString(),
      icon: Activity,
      description: "Across all creators",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your YouTube creator database
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? "..." : stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
