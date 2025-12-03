import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Challenge {
  id: string;
  title: string;
  product_name: string;
  platform: string[] | null;
}

interface ApplyToChallengeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challenge: Challenge;
  onSuccess: () => void;
}

const ApplyToChallengeDialog = ({ open, onOpenChange, challenge, onSuccess }: ApplyToChallengeDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    social_platform: "",
    social_handle: "",
    follower_count: "",
    message: "",
    shipping_address: "",
  });

  // Load user's saved address when dialog opens
  useEffect(() => {
    if (open) {
      loadUserAddress();
    }
  }, [open]);

  const loadUserAddress = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("address")
      .eq("id", session.user.id)
      .single();

    if (profile && (profile as any).address) {
      setFormData(prev => ({ ...prev, shipping_address: (profile as any).address }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in to apply");
      setLoading(false);
      return;
    }

    // Check if already applied
    const { data: existing } = await supabase
      .from("challenge_applications")
      .select("id")
      .eq("challenge_id", challenge.id)
      .eq("creator_id", session.user.id)
      .maybeSingle();

    if (existing) {
      toast.error("You have already applied to this challenge");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("challenge_applications").insert({
      challenge_id: challenge.id,
      creator_id: session.user.id,
      social_platform: formData.social_platform,
      social_handle: formData.social_handle,
      follower_count: formData.follower_count ? parseInt(formData.follower_count) : null,
      message: formData.message || null,
      shipping_address: formData.shipping_address || null,
      status: "pending",
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("You have already applied to this challenge");
      } else {
        toast.error("Failed to submit application");
        console.error(error);
      }
    } else {
      toast.success("Application submitted successfully!");
      onOpenChange(false);
      onSuccess();
      // Reset form
      setFormData({
        social_platform: "",
        social_handle: "",
        follower_count: "",
        message: "",
        shipping_address: "",
      });
    }

    setLoading(false);
  };

  const availablePlatforms = challenge.platform || ["instagram", "tiktok"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle>Apply to Challenge</DialogTitle>
          <DialogDescription>
            {challenge.title} - {challenge.product_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platform">Platform *</Label>
            <Select
              value={formData.social_platform}
              onValueChange={(value) => setFormData({ ...formData, social_platform: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                {availablePlatforms.map((platform) => (
                  <SelectItem key={platform} value={platform} className="capitalize">
                    {platform}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="handle">Social Handle *</Label>
            <Input
              id="handle"
              value={formData.social_handle}
              onChange={(e) => setFormData({ ...formData, social_handle: e.target.value })}
              placeholder="@yourusername"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="followers">Follower Count</Label>
            <Input
              id="followers"
              type="number"
              value={formData.follower_count}
              onChange={(e) => setFormData({ ...formData, follower_count: e.target.value })}
              placeholder="e.g., 5000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Why should we choose you?</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Tell us about your content and why you'd be a great fit..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Shipping Address</Label>
            <Textarea
              id="address"
              value={formData.shipping_address}
              onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
              placeholder="Your full shipping address for product delivery"
              rows={2}
            />
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="rounded-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ApplyToChallengeDialog;
