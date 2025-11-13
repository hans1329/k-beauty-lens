import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Search, Gift } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AnalysisProgressModal from "./AnalysisProgressModal";
import logoRed from "@/assets/logo_linkk_red.png";
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
      toast("Enter a channel handle", {
        description: "Please enter a YouTube channel handle (e.g., @username)"
      });
      return;
    }

    // Only allow @username format
    const atHandleRegex = /^@[\w-]+$/;
    if (!atHandleRegex.test(targetChannelId)) {
      toast("Invalid format", {
        description: "Please use the @username format (e.g., @username)"
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

    // Increment quota usage based on energy cost for search
    try {
      const {
        data: energyCost
      } = await supabase.from('energy_costs' as any).select('cost').eq('action_type', 'search').single();
      const cost = (energyCost as any)?.cost || 1;
      const {
        data: quotaResult,
        error: quotaError
      } = await (supabase as any).rpc('increment_quota_usage', {
        quota_cost: cost
      });
      if (quotaError) throw quotaError;
      const result = quotaResult?.[0];
      if (result?.is_exceeded) {
        toast.error("Energy Depleted", {
          description: "Daily energy refreshes at midnight (KST). You can purchase additional energy to continue searching.",
          duration: 5000
        });
        setIsLoading(false);
        return;
      }

      // Show reward notification if given
      if (result?.reward_given) {
        const {
          data: rewardSetting
        } = await (supabase as any).from('reward_settings').select('setting_value').eq('setting_key', 'daily_completion_reward').single();
        const rewardAmount = rewardSetting?.setting_value || 5;
        toast.success("Daily Quest Complete!", {
          description: `You've earned ${rewardAmount} bonus energy for completing your daily quota!`,
          icon: <Gift className="h-5 w-5" />
        });
      }

      // Show energy consumption notification
      const remaining = result?.quota_limit - result?.current_usage;
      const energyType = result?.used_purchased ? "Purchased Energy" : "Daily Energy";
      toast.success(`${cost} ${energyType} Consumed`, {
        description: `${remaining} daily energy remaining`
      });
    } catch (error) {
      console.error("Error updating quota:", error);
    }

    // Check if creator already exists
    setIsLoading(true);
    try {
      const {
        data: existingCreator
      } = await supabase.from('creators').select('id, channel_name, custom_url').eq('custom_url', targetChannelId).maybeSingle();
      if (existingCreator) {
        toast("Creator already exists", {
          description: `${existingCreator.channel_name} is already in our database. Redirecting...`
        });

        // Save search to database
        try {
          await supabase.from("user_searches").insert({
            user_id: session.user.id,
            channel_id: targetChannelId,
            channel_name: existingCreator.channel_name,
            channel_thumbnail: null
          });
        } catch (error) {
          console.error("Error saving search:", error);
        }
        setChannelId("");
        setIsLoading(false);

        // Navigate to existing creator page using custom_url
        setTimeout(() => {
          navigate(`/creator/${existingCreator.custom_url}`);
        }, 1000);
        return;
      }
    } catch (error) {
      console.error("Error checking existing creator:", error);
    }
    setIsLoading(false);

    // Save search to database
    try {
      await supabase.from("user_searches").insert({
        user_id: session.user.id,
        channel_id: targetChannelId,
        channel_name: targetChannelId,
        channel_thumbnail: null
      });
    } catch (error) {
      console.error("Error saving search:", error);
    }
    setAnalyzingChannelId(targetChannelId);
    setShowProgressModal(true);
    setChannelId("");
  };
  const handleAnalysisComplete = (creatorId: string, customUrl?: string) => {
    setShowProgressModal(false);
    // Use custom_url if available, otherwise fallback to creatorId
    navigate(`/creator/${customUrl || creatorId}`);
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
              <img src={logoRed} alt="Linkk Logo" className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 h-6 w-6 md:h-7 md:w-7 z-10" />
              <Input type="text" name="search-query" id="youtube-search" placeholder="" value={channelId} onChange={e => setChannelId(e.target.value)} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} disabled={isLoading} autoComplete="off" data-form-type="other" data-lpignore="true" className={`w-full bg-white/5 backdrop-blur rounded-full h-12 md:h-14 text-base md:text-lg font-bold pl-12 pr-12 md:pl-16 md:pr-14 border-0 placeholder:text-white/60 focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-0 transition-colors caret-white ${isFocused ? 'text-white' : 'text-white/80'}`} />
              <button type="submit" disabled={isLoading || !channelId.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 disabled:opacity-50 transition-all" aria-label="Search">
                {isLoading ? <Loader2 className={`h-6 w-6 md:h-7 md:w-7 animate-spin ${isFocused ? 'text-white' : 'text-pink-400'}`} /> : <Search className={`h-6 w-6 md:h-7 md:w-7 ${isFocused ? 'text-white' : 'text-pink-400'}`} />}
              </button>
            </form>
          </CardContent>
        </Card>
        
        <p className="text-center text-white/60 text-sm mt-3">
          @username on YouTube  
        </p>
      </div>

      <AnalysisProgressModal open={showProgressModal} onOpenChange={setShowProgressModal} onComplete={handleAnalysisComplete} channelId={analyzingChannelId} />
    </section>;
};
export default HeroSection;