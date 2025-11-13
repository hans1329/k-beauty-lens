import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import YouTuberCard from "@/components/YouTuberCard";

interface SearchHistory {
  id: string;
  channel_id: string;
  channel_name: string;
  channel_thumbnail: string | null;
  searched_at: string;
  creator?: {
    id: string;
    channel_id: string;
    channel_name: string;
    subscriber_count: number;
    total_views: number;
    video_count: number;
    description: string;
    thumbnail_url: string;
    custom_url: string;
    is_visible: boolean;
  };
}

const MySearches = () => {
  const [searches, setSearches] = useState<SearchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    loadSearchHistory();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadSearchHistory = async () => {
    try {
      const { data: searchesData, error: searchError } = await supabase
        .from("user_searches")
        .select("*")
        .order("searched_at", { ascending: false });

      if (searchError) throw searchError;

      if (!searchesData || searchesData.length === 0) {
        setSearches([]);
        return;
      }

      // Fetch creator details for each search - match by custom_url (case insensitive)
      const channelIds = searchesData.map(s => s.channel_id.toLowerCase());
      const { data: creatorsData, error: creatorsError } = await supabase
        .from("creators")
        .select("*")
        .filter('custom_url', 'in', `(${channelIds.join(',')})`);

      if (creatorsError) {
        console.error("Error fetching creators:", creatorsError);
      }

      // Merge creator data with search history - match by custom_url
      const enrichedSearches = searchesData.map(search => ({
        ...search,
        creator: creatorsData?.find(c => c.custom_url?.toLowerCase() === search.channel_id.toLowerCase())
      }));

      console.log("Loaded searches:", enrichedSearches);
      setSearches(enrichedSearches);
    } catch (error) {
      console.error("Error loading search history:", error);
      toast.error("Failed to load search history");
    } finally {
      setLoading(false);
    }
  };

  const deleteSearch = async (id: string) => {
    try {
      const { error } = await supabase
        .from("user_searches")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setSearches(searches.filter(s => s.id !== id));
      toast.success("Search removed");
    } catch (error) {
      console.error("Error deleting search:", error);
      toast.error("Failed to remove search");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground">My Searches</h1>
          <p className="text-muted-foreground mt-2">
            View your recently searched beauty creators
          </p>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : searches.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-lg mb-4">No search history yet.</p>
              <Button
                onClick={() => navigate("/")}
                className="rounded-full"
              >
                Start Searching
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searches.map((search) => {
              const creator = search.creator;
              
              // If creator data is not available, use search data as fallback
              if (!creator) {
                console.log("No creator data for:", search);
                return (
                  <div key={search.id} className="relative">
                    <Button
                      onClick={() => deleteSearch(search.id)}
                      variant="outline"
                      size="icon"
                      className="absolute top-2 right-2 z-10 rounded-full bg-background/80 hover:bg-background shadow-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Card className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          {search.channel_thumbnail && (
                            <img
                              src={search.channel_thumbnail}
                              alt={search.channel_name}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">
                              {search.channel_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Searched on {new Date(search.searched_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Creator data not available yet
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                );
              }

              const displayHandle = creator.custom_url
                ? creator.custom_url.startsWith('@')
                  ? creator.custom_url
                  : `@${creator.custom_url}`
                : `@${creator.channel_name}`;

              const formatNumber = (num: number): string => {
                if (num >= 1000000) {
                  return `${(num / 1000000).toFixed(1)}M`;
                } else if (num >= 1000) {
                  return `${(num / 1000).toFixed(1)}K`;
                }
                return num.toString();
              };

              const calculateEngagement = (): number => {
                if (creator.subscriber_count === 0) return 0;
                const avgViews = creator.total_views / (creator.video_count || 1);
                const ratio = (avgViews / creator.subscriber_count) * 100;
                return Math.min(Math.round(ratio), 100);
              };

              return (
                <div key={search.id} className="relative">
                  <Button
                    onClick={() => deleteSearch(search.id)}
                    variant="outline"
                    size="icon"
                    className="absolute top-2 right-2 z-10 rounded-full bg-background/80 hover:bg-background shadow-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <YouTuberCard
                    id={creator.id}
                    name={creator.channel_name}
                    channel={displayHandle}
                    subscribers={formatNumber(creator.subscriber_count)}
                    avgViews={formatNumber(Math.floor(creator.total_views / (creator.video_count || 1)))}
                    engagement={calculateEngagement()}
                    skinTone="Light"
                    style={["Natural"]}
                    brands={[]}
                    thumbnail={creator.thumbnail_url}
                    channelUrl={`https://youtube.com/channel/${creator.channel_id}`}
                    isVisible={creator.is_visible}
                    variant="vertical"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MySearches;
