import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import Navigation from "@/components/Navigation";

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

const ChallengeForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
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

  useEffect(() => {
    checkAuth();
    if (isEditMode) {
      loadChallenge();
    }
  }, [id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", session.user.id)
      .single();
    
    if (profile?.user_type !== "brand") {
      toast.error("Only brands can create challenges");
      navigate("/challenges");
    }
  };

  const loadChallenge = async () => {
    const { data: challenge, error } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !challenge) {
      toast.error("Challenge not found");
      navigate("/challenges");
      return;
    }

    const platforms = challenge.platform || [];
    setFormData({
      title: challenge.title || "",
      description: challenge.description || "",
      product_name: challenge.product_name || "",
      product_image_url: challenge.product_image_url || "",
      product_value: challenge.product_value?.toString() || "",
      max_applicants: challenge.max_applicants?.toString() || "10",
      requirements: challenge.requirements || "",
      application_deadline: challenge.application_deadline
        ? challenge.application_deadline.split("T")[0]
        : "",
      platforms: {
        instagram: platforms.includes("instagram"),
        tiktok: platforms.includes("tiktok"),
        youtube: platforms.includes("youtube"),
      },
    });
    setInitialLoading(false);
  };

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

    if (isEditMode) {
      const result = await supabase
        .from("challenges")
        .update(challengeData)
        .eq("id", id);
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
      navigate("/challenges");
    }

    setLoading(false);
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/challenges")}
          className="mb-6 rounded-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Challenges
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{isEditMode ? "Edit Challenge" : "Create New Challenge"}</CardTitle>
            <CardDescription>
              {isEditMode ? "Update your challenge details" : "Register a product for creators to review"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  rows={4}
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
                <div className="flex gap-6">
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
                  rows={3}
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

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/challenges")}
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
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ChallengeForm;
