import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  return <section className="relative overflow-hidden py-20 px-6">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-instagram" />
      
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-primary/20 blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-secondary/20 blur-3xl animate-float" style={{
      animationDelay: "1s"
    }} />
      
      <div className="container mx-auto max-w-3xl relative z-10">
        <div className="text-center space-y-6 mb-8">
          <h1 className="text-5xl font-bold tracking-tight text-white md:text-5xl">
            Explore Analyzed
            <br />
            <span className="text-white drop-shadow-lg">K-Beauty Insights</span>
          </h1>
          
          <p className="text-white/90 max-w-2xl mx-auto drop-shadow text-lg">
            View analyzed data and insights for Korean beauty YouTubers
          </p>
        </div>

        <Card className="shadow-2xl border-border/50 backdrop-blur-sm bg-background/40 rounded-full">
          <CardContent className="pt-4 pb-4 px-6">
            <div className="flex flex-row gap-3 items-center">
              <Input placeholder="@username or https://youtube.com/@username" value={channelId} onChange={e => setChannelId(e.target.value)} disabled={isLoading} className="flex-1 bg-background/60 backdrop-blur rounded-full h-14" onKeyDown={e => {
              if (e.key === 'Enter' && !isLoading && channelId.trim()) {
                handleSync();
              }
            }} />
              <Button onClick={handleSync} disabled={isLoading || !channelId.trim()} className="rounded-full h-14 w-14" size="icon">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>;
};
export default HeroSection;