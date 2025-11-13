import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AnalysisStep {
  id: string;
  label: string;
  status: "pending" | "processing" | "completed" | "error";
}

interface AnalysisProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (channelId: string, customUrl?: string) => void;
  channelId: string;
}

const AnalysisProgressModal = ({ 
  open, 
  onOpenChange, 
  onComplete,
  channelId 
}: AnalysisProgressModalProps) => {
  const [steps, setSteps] = useState<AnalysisStep[]>([
    { id: "fetch-channel", label: "Fetching channel information", status: "pending" },
    { id: "fetch-videos", label: "Fetching video list", status: "pending" },
    { id: "extract-brands", label: "Extracting brand mentions", status: "pending" },
    { id: "analyze-sentiment", label: "Analyzing sentiment", status: "pending" },
  ]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [quotaUsage, setQuotaUsage] = useState<{ current: number; limit: number } | null>(null);

  // Fetch current quota usage
  useEffect(() => {
    const fetchQuota = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('api_quota_usage' as any)
        .select('quota_used, quota_limit')
        .eq('date', today)
        .maybeSingle();
      
      if (data) {
        setQuotaUsage({ current: (data as any).quota_used, limit: (data as any).quota_limit });
      } else {
        setQuotaUsage({ current: 0, limit: 3000 });
      }
    };

    if (open) {
      fetchQuota();
    }
  }, [open]);

  useEffect(() => {
    if (!open || !channelId) return;

    let cancelled = false;

    const runAnalysis = async () => {
      try {
        // Step 1: Fetch channel information
        setCurrentStepIndex(0);
        setSteps(prev => prev.map((step, idx) => ({
          ...step,
          status: idx === 0 ? "processing" : "pending"
        })));

        const { data, error } = await supabase.functions.invoke('youtube-sync', {
          body: { channelId }
        });

        if (cancelled) return;

        // Check for error response
        if (error) {
          throw error;
        }
        
        // Check if response indicates quota exceeded
        if (data && data.error === 'QUOTA_EXCEEDED') {
          throw { error: 'QUOTA_EXCEEDED', ...data };
        }
        
        // Check if response indicates channel not found
        if (data && data.error === 'CHANNEL_NOT_FOUND') {
          throw new Error('CHANNEL_NOT_FOUND');
        }

        // Update quota display
        if (data?.quotaUsed) {
          const today = new Date().toISOString().split('T')[0];
          const { data: quotaData } = await supabase
            .from('api_quota_usage' as any)
            .select('quota_used, quota_limit')
            .eq('date', today)
            .maybeSingle();
          
          if (quotaData) {
            setQuotaUsage({ current: (quotaData as any).quota_used, limit: (quotaData as any).quota_limit });
          }
        }

        // Update user_searches with actual channel data
        if (data?.creator) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await supabase
              .from('user_searches')
              .update({
                channel_name: data.creator.channel_name,
                channel_thumbnail: data.creator.thumbnail_url
              })
              .eq('user_id', session.user.id)
              .eq('channel_id', channelId);
          }
        }

        // Mark all steps as processing sequentially
        for (let i = 1; i < steps.length; i++) {
          if (cancelled) break;
          
          setCurrentStepIndex(i);
          setSteps(prev => prev.map((step, idx) => ({
            ...step,
            status: idx === i ? "processing" : idx < i ? "completed" : "pending"
          })));

          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (!cancelled) {
          setSteps(prev => prev.map(step => ({ ...step, status: "completed" })));
          setIsCompleted(true);
          
          toast.success(data?.message || "Analysis completed successfully");
          
          setTimeout(() => {
            onComplete(data?.creator?.id || channelId, data?.creator?.custom_url);
          }, 1000);
        }
      } catch (err) {
        if (cancelled) return;
        
        console.error('Analysis error:', err);
        let errorMessage = "Analysis failed";
        
        // Check if error has specific type
        if (err && typeof err === 'object') {
          const errorData = err as any;
          
          if (errorData.error === 'QUOTA_EXCEEDED') {
            errorMessage = "Daily API quota exceeded. Please try again tomorrow.";
            toast.error(errorMessage, {
              description: `Current usage: ${errorData.currentQuota || 'N/A'}/${errorData.quotaLimit || '3,000'}`
            });
            setError(errorMessage);
            setSteps(prev => prev.map(step => ({
              ...step,
              status: step.status === "processing" ? "error" : step.status
            })));
            return;
          } else if (errorData.error === 'CHANNEL_NOT_FOUND') {
            errorMessage = 'Channel not found';
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        
        // User-friendly error messages
        if (errorMessage.includes("CHANNEL_NOT_FOUND") || errorMessage.includes("Channel not found")) {
          toast("Channel not found", {
            description: "We couldn't find this YouTube channel. Please check the handle and try again."
          });
        } else if (errorMessage.includes("invalid") || errorMessage.includes("Invalid")) {
          toast("Invalid channel", {
            description: "The channel format appears to be invalid. Please use @username format."
          });
        } else {
          toast("Unable to analyze channel", {
            description: "We encountered an issue analyzing this channel. Please try again later."
          });
        }
        
        setError(errorMessage);
        
        setSteps(prev => prev.map(step => ({
          ...step,
          status: step.status === "processing" ? "error" : step.status
        })));
      }
    };

    runAnalysis();

    return () => {
      cancelled = true;
    };
  }, [open, channelId]);

  const handleCancel = () => {
    setError("Analysis cancelled by user");
    onOpenChange(false);
  };

  const progress = ((steps.filter(s => s.status === "completed").length) / steps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background/10 backdrop-blur-3xl border-white/5" hideClose>
        <DialogHeader>
          <DialogTitle className="text-white">Analyzing YouTube Channel</DialogTitle>
          <DialogDescription className="text-white/80">
            Please wait while we analyze the channel data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Progress value={progress} className="w-full" />

          <div className="space-y-3">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-3">
                {step.status === "completed" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : step.status === "processing" ? (
                  <Loader2 className="h-5 w-5 text-primary animate-spin flex-shrink-0" />
                ) : step.status === "error" ? (
                  <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    step.status === "completed"
                      ? "text-white"
                      : step.status === "processing"
                      ? "text-white font-medium"
                      : "text-white/70"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center gap-3">
          {quotaUsage && (
            <span className="text-sm text-white/70 font-mono">
              {quotaUsage.current}/{quotaUsage.limit}
            </span>
          )}
          {!isCompleted && (
            <Button
              variant="outline"
              onClick={handleCancel}
              className="rounded-full text-white/60 border-white/20 bg-transparent hover:text-white hover:bg-white/10"
            >
              Cancel
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AnalysisProgressModal;
