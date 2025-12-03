import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Instagram, Clock, Users, Package, Loader2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import ApplyToChallengeDialog from "@/components/challenges/ApplyToChallengeDialog";
import type { User } from "@supabase/supabase-js";

interface Challenge {
  id: string;
  brand_id: string;
  title: string;
  description: string | null;
  product_name: string;
  product_image_url: string | null;
  product_value: number | null;
  max_applicants: number | null;
  platform: string[] | null;
  requirements: string | null;
  status: string;
  application_deadline: string | null;
  created_at: string;
  brand?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  application_count?: number;
  has_applied?: boolean;
}

const Challenges = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<string>("general_user");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [myChallenges, setMyChallenges] = useState<Challenge[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", session.user.id)
        .single();
      if (profile) {
        setUserType(profile.user_type);
      }
    }
    loadChallenges();
  };

  const loadChallenges = async () => {
    setLoading(true);
    
    // Load all open challenges
    const { data: challengesData, error } = await supabase
      .from("challenges")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load challenges");
      console.error(error);
    } else {
      // Get brand info for each challenge
      const enrichedChallenges = await Promise.all(
        (challengesData || []).map(async (challenge) => {
          const { data: brand } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", challenge.brand_id)
            .single();

          return {
            ...challenge,
            brand,
            application_count: (challenge as any).current_applicants || 0,
          };
        })
      );
      setChallenges(enrichedChallenges);
    }

    // Load user-specific data
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      // Load my challenges (for brands)
      const { data: myData } = await supabase
        .from("challenges")
        .select("*")
        .eq("brand_id", session.user.id)
        .order("created_at", { ascending: false });
      setMyChallenges(myData || []);

      // Load my applications (for creators)
      const { data: appData } = await supabase
        .from("challenge_applications")
        .select("*, challenges(*)")
        .eq("creator_id", session.user.id)
        .order("created_at", { ascending: false });
      setMyApplications(appData || []);
    }

    setLoading(false);
  };

  const handleApply = (challenge: Challenge) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setSelectedChallenge(challenge);
    setApplyDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      selected: { variant: "default", label: "Selected" },
      rejected: { variant: "destructive", label: "Rejected" },
      shipped: { variant: "outline", label: "Shipped" },
      submitted: { variant: "default", label: "Submitted" },
      completed: { variant: "default", label: "Completed" },
    };
    const config = statusConfig[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No deadline";
    return new Date(dateString).toLocaleDateString();
  };

  const getRemainingTime = (dateString: string | null) => {
    if (!dateString) return null;
    const deadline = new Date(dateString);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    
    if (diffMs < 0) return "Expired";
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) return `${diffDays}d left`;
    if (diffHours > 0) return `${diffHours}h left`;
    return "< 1h left";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Challenges</h1>
            <p className="text-muted-foreground">
              Collaborate with brands and creators for product reviews
            </p>
          </div>
          
          {user && userType === "brand" && (
            <Button onClick={() => navigate("/challenges/new")} className="rounded-full">
              <Plus className="mr-2 h-4 w-4" />
              Create Challenge
            </Button>
          )}
        </div>

        <Tabs defaultValue="explore" className="space-y-6">
          <TabsList>
            <TabsTrigger value="explore">Explore</TabsTrigger>
            {user && userType === "creator" && (
              <TabsTrigger value="applications">My Applications</TabsTrigger>
            )}
            {user && userType === "brand" && (
              <TabsTrigger value="my-challenges">My Challenges</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="explore">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : challenges.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No challenges available</h3>
                  <p className="text-muted-foreground">
                    Check back later for new product review opportunities
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {challenges.map((challenge) => (
                <Card 
                  key={challenge.id} 
                  className="flex flex-col cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/challenges/${challenge.id}`)}
                >
                    <div className="aspect-square bg-muted rounded-t-lg overflow-hidden flex items-center justify-center relative">
                      {challenge.product_image_url ? (
                        <img
                          src={challenge.product_image_url}
                          alt={challenge.product_name}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <Package className="h-12 w-12 text-muted-foreground" />
                      )}
                      {challenge.application_deadline && (
                        <Badge 
                          variant={getRemainingTime(challenge.application_deadline) === "Expired" ? "destructive" : "secondary"}
                          className="absolute bottom-2 right-2 text-xs"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {getRemainingTime(challenge.application_deadline)}
                        </Badge>
                      )}
                    </div>
                    <CardHeader>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <span>{challenge.brand?.full_name || "Unknown Brand"}</span>
                      </div>
                      <CardTitle className="line-clamp-2">{challenge.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {challenge.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="text-base font-semibold">{challenge.product_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {challenge.application_count} / {challenge.max_applicants || "∞"} applicants
                          </span>
                        </div>
                        {challenge.platform && challenge.platform.length > 0 && (
                          <div className="flex gap-2">
                            {challenge.platform.map((p) => (
                              <Badge key={p} variant="outline" className="capitalize">
                                {p}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      {(() => {
                        const hasApplied = myApplications.some(app => app.challenge_id === challenge.id);
                        return (
                          <Badge 
                            variant={hasApplied ? "secondary" : "default"}
                            className="w-full justify-center py-2"
                          >
                            {hasApplied ? "Already Applied" : "View Details"}
                          </Badge>
                        );
                      })()}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {user && userType === "creator" && (
            <TabsContent value="applications">
              {myApplications.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <p className="text-muted-foreground">
                      You haven't applied to any challenges yet
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {myApplications.map((app) => (
                    <Card key={app.id}>
                      <div className="flex">
                        {app.challenges?.product_image_url && (
                          <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-muted flex items-center justify-center rounded-l-lg overflow-hidden">
                            <img
                              src={app.challenges.product_image_url}
                              alt={app.challenges.product_name}
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <CardHeader>
                            <div className="flex items-center justify-between gap-2">
                              <CardTitle className="text-lg">
                                {app.challenges?.title || "Unknown Challenge"}
                              </CardTitle>
                              {getStatusBadge(app.status)}
                            </div>
                            <CardDescription>
                              {app.challenges?.product_name && (
                                <span className="font-medium text-foreground">{app.challenges.product_name}</span>
                              )}
                              <span className="block text-xs mt-1">
                                Applied on {new Date(app.created_at).toLocaleDateString()}
                              </span>
                            </CardDescription>
                          </CardHeader>
                          {app.status === "shipped" && !app.content_url && (
                            <CardContent>
                              <p className="text-sm text-muted-foreground mb-2">
                                Product shipped! Submit your content URL after posting.
                              </p>
                              <Button size="sm" className="rounded-full">
                                Submit Content URL
                              </Button>
                            </CardContent>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {user && userType === "brand" && (
            <TabsContent value="my-challenges">
              {myChallenges.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      You haven't created any challenges yet
                    </p>
                    <Button onClick={() => navigate("/challenges/new")} className="rounded-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Challenge
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {myChallenges.map((challenge) => (
                    <Card key={challenge.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{challenge.title}</CardTitle>
                          <Badge variant={challenge.status === "open" ? "default" : "secondary"}>
                            {challenge.status}
                          </Badge>
                        </div>
                        <CardDescription>{challenge.product_name}</CardDescription>
                      </CardHeader>
                      <CardFooter className="gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-full"
                          onClick={() => navigate(`/challenges/${challenge.id}/edit`)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-full"
                          onClick={() => navigate(`/challenges/${challenge.id}`)}
                        >
                          Manage Applications
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </main>

      {selectedChallenge && (
        <ApplyToChallengeDialog
          open={applyDialogOpen}
          onOpenChange={setApplyDialogOpen}
          challenge={selectedChallenge}
          onSuccess={loadChallenges}
        />
      )}
    </div>
  );
};

export default Challenges;
