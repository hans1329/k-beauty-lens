import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Building2, Video, Loader2, AlertTriangle, ArrowLeft } from "lucide-react";

const SelectUserType = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedType, setSelectedType] = useState<"brand" | "creator" | null>(null);
  const [currentType, setCurrentType] = useState<string>("general_user");

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
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

    if (profile) {
      setCurrentType(profile.user_type);
      if (profile.user_type === "creator") {
        setSelectedType("creator");
      }
    }

    setLoading(false);
  };

  const handleSelectType = async () => {
    if (!selectedType) {
      toast.error("Please select your account type");
      return;
    }

    // Prevent brand users from changing type
    if (currentType === "brand") {
      toast.error("Brand accounts cannot change type");
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

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Brand users cannot change type
  if (currentType === "brand") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Building2 className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Brand Account</h1>
          <p className="text-muted-foreground mb-6">
            You are registered as a brand account.
          </p>
          <Alert variant="destructive" className="mb-6 text-left">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Brand accounts cannot change their account type to protect challenge data integrity.
            </AlertDescription>
          </Alert>
          <Button onClick={handleBack} variant="outline" className="rounded-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {currentType === "general_user" ? "Welcome to Linkkbeauty!" : "Change Account Type"}
          </h1>
          <p className="text-muted-foreground">
            {currentType === "general_user" 
              ? "Select your account type to get started" 
              : "You can change your account type below"}
          </p>
          {currentType === "creator" && (
            <p className="text-xs text-muted-foreground mt-2">
              Current type: <span className="font-medium capitalize">{currentType}</span>
            </p>
          )}
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
              {currentType !== "general_user" && (
                <p className="text-xs text-destructive mt-3">
                  ⚠️ Once changed to Brand, you cannot switch back
                </p>
              )}
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
            disabled={!selectedType || saving || (currentType === selectedType)}
            className="w-full rounded-full"
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : currentType === selectedType ? (
              "Already Selected"
            ) : (
              "Continue"
            )}
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="w-full rounded-full"
          >
            {currentType === "general_user" ? "Skip for now" : "Cancel"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SelectUserType;
