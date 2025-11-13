import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
const HeroSection = () => {
  const [channelId, setChannelId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const handleSync = async () => {
    const targetChannelId = channelId.trim();
    if (!targetChannelId) {
      toast.error("Please enter a valid YouTube channel ID");
      return;
    }
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('youtube-sync', {
        body: {
          channelId: targetChannelId
        }
      });
      if (error) {
        console.error('Sync error:', error);
        toast.error(`Failed to sync channel: ${error.message}`);
        return;
      }
      toast.success(data.message || 'Channel synced successfully!');
      setChannelId("");
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  return <section className="relative overflow-hidden py-12 md:py-20 px-0 md:px-6">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-instagram" />
      
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-primary/20 blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-secondary/20 blur-3xl animate-float" style={{
      animationDelay: "1s"
    }} />
      
      <div className="container mx-auto max-w-3xl relative z-10 px-4 md:px-0">
        <div className="text-center space-y-4 md:space-y-6 mb-6 md:mb-8">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
            Explore Analyzed
            <br />
            <span className="text-white drop-shadow-lg">K-Beauty Insights</span>
          </h1>
          
          <p className="text-white/90 max-w-2xl mx-auto drop-shadow text-base md:text-lg px-4">
            View analyzed data and insights for Korean beauty YouTubers
          </p>
        </div>

        <Card className="shadow-2xl border-white/20 backdrop-blur-sm bg-white/5 rounded-full">
          <CardContent className="p-0">
            <form 
              role="search" 
              onSubmit={(e) => {
                e.preventDefault();
                if (!isLoading && channelId.trim()) {
                  handleSync();
                }
              }}
              className="relative"
            >
              <Input 
                type="text"
                name="q"
                id="youtube-search"
                placeholder={window.innerWidth < 768 ? "@username" : "@username or https://youtube.com/@username"}
                value={channelId} 
                onChange={e => setChannelId(e.target.value)} 
                disabled={isLoading}
                autoComplete="off"
                className="w-full bg-white/5 backdrop-blur rounded-full h-12 md:h-14 text-base px-4 pr-12 md:px-6 md:pr-14 border-0 text-white placeholder:text-white/60 focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-0" 
              />
              <button
                type="submit"
                disabled={isLoading || !channelId.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 disabled:opacity-50 transition-opacity"
                aria-label="Search"
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 md:h-7 md:w-7 animate-spin text-pink-400" />
                ) : (
                  <Search className="h-6 w-6 md:h-7 md:w-7 text-pink-400" />
                )}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>;
};
export default HeroSection;