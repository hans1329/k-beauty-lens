import { useEffect, useState } from "react";
import HeroSection from "@/components/HeroSection";
import FilterBar from "@/components/FilterBar";
import YouTuberCard from "@/components/YouTuberCard";
import StatsSection from "@/components/StatsSection";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Creator {
  id: string;
  channel_id: string;
  channel_name: string;
  subscriber_count: number;
  total_views: number;
  video_count: number;
  description: string;
  thumbnail_url: string;
  custom_url: string;
}

const Index = () => {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCreators();
  }, []);

  const fetchCreators = async () => {
    try {
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .order('subscriber_count', { ascending: false });

      if (error) {
        console.error('Error fetching creators:', error);
        toast.error('Failed to load creators');
        return;
      }

      setCreators(data || []);
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Sample data for demonstration (fallback if no data)
  const sampleYouTubers = [
    {
      name: "Jisoo Beauty",
      channel: "@jisoobeauty",
      subscribers: "2.5M",
      avgViews: "850K",
      engagement: 92,
      skinTone: "Light",
      style: ["Natural", "Fresh"],
      brands: ["LANEIGE", "innisfree", "3CE"],
      thumbnail: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&h=400&fit=crop",
      channelUrl: "https://youtube.com",
    },
    {
      name: "Minji Glam",
      channel: "@minjiglam",
      subscribers: "1.8M",
      avgViews: "620K",
      engagement: 88,
      skinTone: "Medium",
      style: ["Glam", "Editorial"],
      brands: ["HERA", "Sulwhasoo", "MISSHA"],
      thumbnail: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop",
      channelUrl: "https://youtube.com",
    },
    {
      name: "Soyeon Soft",
      channel: "@soyeonsoft",
      subscribers: "3.2M",
      avgViews: "1.1M",
      engagement: 95,
      skinTone: "Light",
      style: ["Soft", "Romantic"],
      brands: ["ETUDE", "Peripera", "rom&nd"],
      thumbnail: "https://images.unsplash.com/photo-1596815064285-45ed8a9c0463?w=400&h=400&fit=crop",
      channelUrl: "https://youtube.com",
    },
    {
      name: "Hana Chic",
      channel: "@hanachic",
      subscribers: "980K",
      avgViews: "340K",
      engagement: 85,
      skinTone: "Tan",
      style: ["Chic", "Bold"],
      brands: ["MAC", "Clio", "VDL"],
      thumbnail: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
      channelUrl: "https://youtube.com",
    },
    {
      name: "Yuna Everyday",
      channel: "@yunaeveryday",
      subscribers: "1.5M",
      avgViews: "580K",
      engagement: 90,
      skinTone: "Light",
      style: ["Natural", "Daily"],
      brands: ["COSRX", "Some By Mi", "Banila Co"],
      thumbnail: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
      channelUrl: "https://youtube.com",
    },
    {
      name: "Chaeyoung Pro",
      channel: "@chaeyoungpro",
      subscribers: "720K",
      avgViews: "290K",
      engagement: 82,
      skinTone: "Medium",
      style: ["Professional", "Tutorial"],
      brands: ["NARS", "Bobbi Brown", "Espoir"],
      thumbnail: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop",
      channelUrl: "https://youtube.com",
    },
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSection />
      
      <div className="container mx-auto max-w-7xl px-6 py-12 space-y-12">
        {/* Platform Stats */}
        <StatsSection />

        {/* Search and Filter */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Discover Creators</h2>
              <p className="text-muted-foreground mt-1">
                Browse through our curated list of Korean beauty YouTubers
              </p>
            </div>
          </div>
          
          <FilterBar />
        </div>

        {/* YouTuber Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : creators.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creators.map((creator) => {
              const displayHandle = creator.custom_url 
                ? (creator.custom_url.startsWith('@') ? creator.custom_url : `@${creator.custom_url}`)
                : `@${creator.channel_name}`;
              
              return (
                <YouTuberCard
                  key={creator.id}
                  id={creator.channel_id}
                  name={creator.channel_name}
                  channel={displayHandle}
                  subscribers={formatNumber(creator.subscriber_count)}
                  avgViews={formatNumber(Math.floor(creator.total_views / (creator.video_count || 1)))}
                  engagement={calculateEngagement(creator)}
                  skinTone="Light"
                  style={["Natural"]}
                  brands={[]}
                  thumbnail={creator.thumbnail_url}
                  channelUrl={`https://youtube.com/channel/${creator.channel_id}`}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              No creators found. Add some channels in the admin panel to get started!
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-20">
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <div className="text-xl font-bold gradient-text">Linkkbeauty</div>
              <p className="text-sm text-muted-foreground mt-1">
                Connecting brands with K-Beauty creators
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Linkkbeauty. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Helper functions
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

function calculateEngagement(creator: Creator): number {
  // Simple engagement calculation based on views to subscribers ratio
  if (creator.subscriber_count === 0) return 0;
  const avgViews = creator.total_views / (creator.video_count || 1);
  const ratio = (avgViews / creator.subscriber_count) * 100;
  return Math.min(Math.round(ratio), 100);
}

export default Index;
