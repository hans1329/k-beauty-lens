import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AnalysisProgressModal from "./AnalysisProgressModal";
const HeroSection = () => {
  const navigate = useNavigate();
  const [channelId, setChannelId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [analyzingChannelId, setAnalyzingChannelId] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const handleSync = async () => {
    const targetChannelId = channelId.trim();
    if (!targetChannelId) {
      toast.error("Please enter a valid YouTube channel ID");
      return;
    }

    // Extract channel handle/ID from various YouTube URL formats
    let extractedChannelId = targetChannelId;
    
    // Handle youtube.com/@username format
    if (targetChannelId.includes('youtube.com/@')) {
      const match = targetChannelId.match(/youtube\.com\/@([^/?]+)/);
      if (match) {
        extractedChannelId = '@' + match[1];
      }
    }
    // Handle @username format
    else if (targetChannelId.startsWith('@')) {
      extractedChannelId = targetChannelId;
    }
    // Handle youtube.com/channel/CHANNEL_ID format
    else if (targetChannelId.includes('youtube.com/channel/')) {
      const match = targetChannelId.match(/youtube\.com\/channel\/([^/?]+)/);
      if (match) {
        extractedChannelId = match[1];
      }
    }
    // Handle youtube.com/c/CustomName format
    else if (targetChannelId.includes('youtube.com/c/')) {
      const match = targetChannelId.match(/youtube\.com\/c\/([^/?]+)/);
      if (match) {
        extractedChannelId = match[1];
      }
    }

    // Basic validation for channel ID format
    if (!extractedChannelId || extractedChannelId.length < 2) {
      toast("Invalid channel format", {
        description: "Please enter a valid YouTube channel handle (e.g., @username) or channel URL"
      });
      return;
    }

    const {
      data: {
        session
      }
    } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in to search");
      navigate("/auth");
      return;
    }

    // Save search to database
    try {
      await supabase.from("user_searches").insert({
        user_id: session.user.id,
        channel_id: extractedChannelId,
        channel_name: extractedChannelId,
        channel_thumbnail: null
      });
    } catch (error) {
      console.error("Error saving search:", error);
    }
    setAnalyzingChannelId(extractedChannelId);
    setShowProgressModal(true);
    setChannelId("");
  };
  const handleAnalysisComplete = (creatorId: string) => {
    setShowProgressModal(false);
    navigate(`/creator/${creatorId}`);
  };
  return <section className="relative overflow-hidden py-12 md:py-20 px-0 md:px-6">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-instagram" />
      
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-primary/20 blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-secondary/20 blur-3xl animate-float" style={{
      animationDelay: "1s"
    }} />
      
      <div className="container mx-auto max-w-xl relative z-10 px-4 md:px-0">
        <div className="text-center space-y-4 md:space-y-6 mb-6 md:mb-8">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
            Explore Analyzed
            <br />
            <span className="text-white drop-shadow-lg">K-Beauty YouTube</span>
          </h1>
          
          
        </div>

        <Card className="shadow-2xl border-white/20 backdrop-blur-sm bg-white/5 rounded-full">
          <CardContent className="p-0">
            <form role="search" autoComplete="off" data-form-type="other" onSubmit={e => {
            e.preventDefault();
            if (!isLoading && channelId.trim()) {
              handleSync();
            }
          }} className="relative">
              <Input type="text" name="search-query" id="youtube-search" placeholder="" value={channelId} onChange={e => setChannelId(e.target.value)} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} disabled={isLoading} autoComplete="off" data-form-type="other" data-lpignore="true" className={`w-full bg-white/5 backdrop-blur rounded-full h-12 md:h-14 text-base md:text-lg font-bold px-4 pr-12 md:px-6 md:pr-14 border-0 placeholder:text-white/60 focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-0 transition-colors caret-white ${isFocused ? 'text-white' : 'text-white/80'}`} />
              <button type="submit" disabled={isLoading || !channelId.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 disabled:opacity-50 transition-all" aria-label="Search">
                {isLoading ? <Loader2 className={`h-6 w-6 md:h-7 md:w-7 animate-spin ${isFocused ? 'text-white' : 'text-pink-400'}`} /> : <Search className={`h-6 w-6 md:h-7 md:w-7 ${isFocused ? 'text-white' : 'text-pink-400'}`} />}
              </button>
            </form>
          </CardContent>
        </Card>
        
        <p className="text-center text-white/60 text-sm mt-3">
          <span className="md:hidden">@username</span>
          <span className="hidden md:inline">@username or https://youtube.com/@username</span>
        </p>
      </div>

      <AnalysisProgressModal open={showProgressModal} onOpenChange={setShowProgressModal} onComplete={handleAnalysisComplete} channelId={analyzingChannelId} />
    </section>;
};
export default HeroSection;