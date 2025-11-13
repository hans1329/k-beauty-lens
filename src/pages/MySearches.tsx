import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";

interface SearchHistory {
  id: string;
  channel_id: string;
  channel_name: string;
  channel_thumbnail: string | null;
  searched_at: string;
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
      const { data, error } = await supabase
        .from("user_searches")
        .select("*")
        .order("searched_at", { ascending: false });

      if (error) throw error;
      setSearches(data || []);
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

  const viewAnalysis = (channelId: string) => {
    navigate(`/analysis/${channelId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 mt-16">
        <h1 className="text-4xl font-bold mb-8 text-foreground">My Searches</h1>
        
        {loading ? (
          <div className="text-center text-muted-foreground">Loading...</div>
        ) : searches.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No search history yet.</p>
              <Button
                onClick={() => navigate("/")}
                className="mt-4"
                variant="outline"
              >
                Start Searching
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {searches.map((search) => (
              <Card key={search.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {search.channel_thumbnail && (
                      <img
                        src={search.channel_thumbnail}
                        alt={search.channel_name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {search.channel_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(search.searched_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={() => viewAnalysis(search.channel_id)}
                      className="flex-1"
                      size="sm"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      onClick={() => deleteSearch(search.id)}
                      variant="outline"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MySearches;
