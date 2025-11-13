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
  onComplete: (channelId: string) => void;
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

        if (error) throw error;

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
            onComplete(channelId);
          }, 1000);
        }
      } catch (err) {
        if (cancelled) return;
        
        console.error('Analysis error:', err);
        const errorMessage = err instanceof Error ? err.message : "Analysis failed";
        setError(errorMessage);
        toast.error(errorMessage);
        
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
      <DialogContent className="sm:max-w-md bg-background/80 backdrop-blur-xl border-white/20">
        <DialogHeader>
          <DialogTitle className="text-foreground">Analyzing YouTube Channel</DialogTitle>
          <DialogDescription className="text-foreground/70">
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
                      ? "text-foreground"
                      : step.status === "processing"
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
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

        <div className="flex justify-end gap-3">
          {!isCompleted && (
            <Button
              variant="outline"
              onClick={handleCancel}
              className="rounded-full"
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
