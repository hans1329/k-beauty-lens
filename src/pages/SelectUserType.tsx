import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Building2, Video, Loader2 } from "lucide-react";

const SelectUserType = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedType, setSelectedType] = useState<"brand" | "creator" | null>(null);

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    // Check if user already selected a type
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", session.user.id)
      .single();

    if (profile && profile.user_type !== "general_user") {
      navigate("/");
      return;
    }

    setLoading(false);
  };

  const handleSelectType = async () => {
    if (!selectedType) {
      toast.error("Please select your account type");
      return;
    }

    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ user_type: selectedType })
      .eq("id", session.user.id);

    if (error) {
      toast.error("Failed to update profile");
      setSaving(false);
      return;
    }

    toast.success("Profile updated successfully!");
    navigate("/");
  };

  const handleSkip = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to Linkkbeauty!</h1>
          <p className="text-muted-foreground">
            Select your account type to get started
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card 
            className={`cursor-pointer transition-all hover:border-primary ${
              selectedType === "brand" ? "border-primary ring-2 ring-primary/20" : ""
            }`}
            onClick={() => setSelectedType("brand")}
          >
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Brand</CardTitle>
              <CardDescription>
                I'm a cosmetics brand looking to collaborate with creators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Register products for review</li>
                <li>• Find and collaborate with creators</li>
                <li>• Track campaign performance</li>
              </ul>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:border-primary ${
              selectedType === "creator" ? "border-primary ring-2 ring-primary/20" : ""
            }`}
            onClick={() => setSelectedType("creator")}
          >
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Video className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Creator</CardTitle>
              <CardDescription>
                I'm a content creator looking for brand collaborations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Apply for product reviews</li>
                <li>• Receive free products</li>
                <li>• Build your portfolio</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={handleSelectType} 
            disabled={!selectedType || saving}
            className="w-full rounded-full"
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Continue"
            )}
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleSkip}
            className="w-full rounded-full"
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SelectUserType;
