import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  product_name: string;
  product_image_url: string | null;
  product_value: number | null;
  max_applicants: number | null;
  platform: string[] | null;
  requirements: string | null;
  application_deadline: string | null;
}

interface CreateChallengeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editChallenge?: Challenge | null;
}

const CreateChallengeDialog = ({ open, onOpenChange, onSuccess, editChallenge }: CreateChallengeDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    product_name: "",
    product_image_url: "",
    product_value: "",
    max_applicants: "10",
    requirements: "",
    application_deadline: "",
    platforms: {
      instagram: true,
      tiktok: true,
      youtube: false,
    },
  });

  const isEditMode = !!editChallenge;

  useEffect(() => {
    if (editChallenge && open) {
      const platforms = editChallenge.platform || [];
      setFormData({
        title: editChallenge.title || "",
        description: editChallenge.description || "",
        product_name: editChallenge.product_name || "",
        product_image_url: editChallenge.product_image_url || "",
        product_value: editChallenge.product_value?.toString() || "",
        max_applicants: editChallenge.max_applicants?.toString() || "10",
        requirements: editChallenge.requirements || "",
        application_deadline: editChallenge.application_deadline 
          ? editChallenge.application_deadline.split('T')[0] 
          : "",
        platforms: {
          instagram: platforms.includes("instagram"),
          tiktok: platforms.includes("tiktok"),
          youtube: platforms.includes("youtube"),
        },
      });
    } else if (!open) {
      // Reset form when closing
      setFormData({
        title: "",
        description: "",
        product_name: "",
        product_image_url: "",
        product_value: "",
        max_applicants: "10",
        requirements: "",
        application_deadline: "",
        platforms: { instagram: true, tiktok: true, youtube: false },
      });
    }
  }, [editChallenge, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in");
      setLoading(false);
      return;
    }

    const selectedPlatforms = Object.entries(formData.platforms)
      .filter(([_, selected]) => selected)
      .map(([platform]) => platform);

    const challengeData = {
      title: formData.title,
      description: formData.description || null,
      product_name: formData.product_name,
      product_image_url: formData.product_image_url || null,
      product_value: formData.product_value ? parseInt(formData.product_value) : null,
      max_applicants: parseInt(formData.max_applicants) || 10,
      platform: selectedPlatforms,
      requirements: formData.requirements || null,
      application_deadline: formData.application_deadline || null,
    };

    let error;

    if (isEditMode && editChallenge) {
      const result = await supabase
        .from("challenges")
        .update(challengeData)
        .eq("id", editChallenge.id);
      error = result.error;
    } else {
      const result = await supabase.from("challenges").insert({
        ...challengeData,
        brand_id: session.user.id,
        status: "open",
      });
      error = result.error;
    }

    if (error) {
      toast.error(isEditMode ? "Failed to update challenge" : "Failed to create challenge");
      console.error(error);
    } else {
      toast.success(isEditMode ? "Challenge updated successfully!" : "Challenge created successfully!");
      onOpenChange(false);
      onSuccess();
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Challenge" : "Create New Challenge"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update your challenge details" : "Register a product for creators to review"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Challenge Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Summer Skincare Review"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_name">Product Name *</Label>
            <Input
              id="product_name"
              value={formData.product_name}
              onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              placeholder="e.g., Hydrating Serum 50ml"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your challenge and what you're looking for..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_image_url">Product Image URL</Label>
            <Input
              id="product_image_url"
              type="url"
              value={formData.product_image_url}
              onChange={(e) => setFormData({ ...formData, product_image_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_value">Product Value (KRW)</Label>
              <Input
                id="product_value"
                type="number"
                value={formData.product_value}
                onChange={(e) => setFormData({ ...formData, product_value: e.target.value })}
                placeholder="50000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_applicants">Max Applicants</Label>
              <Input
                id="max_applicants"
                type="number"
                value={formData.max_applicants}
                onChange={(e) => setFormData({ ...formData, max_applicants: e.target.value })}
                placeholder="10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Platforms</Label>
            <div className="flex gap-4">
              {Object.entries(formData.platforms).map(([platform, checked]) => (
                <div key={platform} className="flex items-center space-x-2">
                  <Checkbox
                    id={platform}
                    checked={checked}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        platforms: { ...formData.platforms, [platform]: !!checked },
                      })
                    }
                  />
                  <Label htmlFor={platform} className="capitalize cursor-pointer">
                    {platform}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Requirements</Label>
            <Textarea
              id="requirements"
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              placeholder="e.g., Minimum 1000 followers, beauty-focused content..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Application Deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.application_deadline}
              onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
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
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : (
                isEditMode ? "Update Challenge" : "Create Challenge"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChallengeDialog;
