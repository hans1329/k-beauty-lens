import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Gift, Clock, Users, ExternalLink, Check, X, Truck, Package } from "lucide-react";
import Navigation from "@/components/Navigation";
import ApplyToChallengeDialog from "@/components/challenges/ApplyToChallengeDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { User } from "@supabase/supabase-js";

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  product_name: string;
  product_image_url: string | null;
  product_detail_url?: string | null;
  product_value: number | null;
  max_applicants: number | null;
  platform: string[] | null;
  requirements: string | null;
  status: string;
  application_deadline: string | null;
  created_at: string;
  brand_id: string;
  current_applicants?: number;
}

interface Application {
  id: string;
  creator_id: string;
  status: string;
  social_platform: string | null;
  social_handle: string | null;
  follower_count: number | null;
  message: string | null;
  shipping_address: string | null;
  content_url: string | null;
  created_at: string;
  creator?: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

const ChallengeDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<string>("general_user");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [brandName, setBrandName] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [hasApplied, setHasApplied] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    applicationId: string;
    action: string;
    title: string;
    description: string;
  }>({ open: false, applicationId: "", action: "", title: "", description: "" });

  const isOwner = user && challenge && user.id === challenge.brand_id;

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);

    // Load challenge first (public access)
    const { data: challengeData, error: challengeError } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (challengeError || !challengeData) {
      toast.error("Challenge not found");
      navigate("/challenges");
      return;
    }

    setChallenge(challengeData);

    // Get brand name
    const { data: brandData } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", challengeData.brand_id)
      .maybeSingle();
    setBrandName(brandData?.full_name || null);

    // Check user session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);

      // Get user type
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", session.user.id)
        .maybeSingle();
      if (profile) {
        setUserType(profile.user_type);
      }

      // Check if user has already applied
      const { data: existingApp } = await supabase
        .from("challenge_applications")
        .select("id")
        .eq("challenge_id", id)
        .eq("creator_id", session.user.id)
        .maybeSingle();
      setHasApplied(!!existingApp);

      // If owner, load applications
      if (session.user.id === challengeData.brand_id) {
        const { data: appData } = await supabase
          .from("challenge_applications")
          .select("*")
          .eq("challenge_id", id)
          .order("created_at", { ascending: false });

        if (appData) {
          const enrichedApps = await Promise.all(
            appData.map(async (app) => {
              const { data: creator } = await supabase
                .from("profiles")
                .select("full_name, email, avatar_url")
                .eq("id", app.creator_id)
                .maybeSingle();
              return { ...app, creator };
            })
          );
          setApplications(enrichedApps);
        }
      }
    }

    setLoading(false);
  };

  const handleApply = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setApplyDialogOpen(true);
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    const { error } = await supabase
      .from("challenge_applications")
      .update({ status: newStatus })
      .eq("id", applicationId);

    if (error) {
      toast.error("Failed to update status");
      console.error(error);
    } else {
      toast.success(`Application ${newStatus}`);
      loadData();
    }
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const openConfirmDialog = (applicationId: string, action: string) => {
    const configs: Record<string, { title: string; description: string }> = {
      selected: {
        title: "Select Applicant",
        description: "Are you sure you want to select this applicant? They will be notified.",
      },
      rejected: {
        title: "Reject Applicant",
        description: "Are you sure you want to reject this applicant?",
      },
      shipped: {
        title: "Mark as Shipped",
        description: "Confirm that you have shipped the product to this creator.",
      },
      completed: {
        title: "Mark as Completed",
        description: "Confirm that this collaboration has been completed.",
      },
    };

    const config = configs[action];
    if (config) {
      setConfirmDialog({
        open: true,
        applicationId,
        action,
        title: config.title,
        description: config.description,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      selected: { variant: "default", label: "Selected" },
      rejected: { variant: "destructive", label: "Rejected" },
      shipped: { variant: "outline", label: "Shipped" },
      submitted: { variant: "default", label: "Content Submitted" },
      completed: { variant: "default", label: "Completed" },
    };
    const config = statusConfig[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!challenge) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto max-w-5xl px-4 sm:px-4 py-6 sm:py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/challenges")}
          className="mb-4 sm:mb-6 rounded-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Challenges
        </Button>

        {/* Challenge Info - Card on desktop, no card on mobile */}
        <div className="mb-8 md:border md:rounded-xl md:bg-card md:shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Product Image */}
            <div className="w-full md:w-80 aspect-square md:aspect-auto md:h-auto flex-shrink-0 bg-muted flex items-center justify-center overflow-hidden">
              {challenge.product_image_url ? (
                <img
                  src={challenge.product_image_url}
                  alt={challenge.product_name}
                  className="w-full h-full object-contain md:object-cover"
                />
              ) : (
                <Package className="h-16 w-16 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="py-4 sm:py-6 px-4 sm:px-6">
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div>
                    <div className="text-sm font-medium text-primary mb-1">
                      {brandName || "Unknown Brand"}
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold mb-2">{challenge.title}</h1>
                    {challenge.description && (
                      <p className="text-sm sm:text-base text-muted-foreground">{challenge.description}</p>
                    )}
                  </div>
                  <Badge variant={challenge.status === "open" ? "default" : "secondary"} className="flex-shrink-0">
                    {challenge.status}
                  </Badge>
                </div>
              
                <div className="space-y-4 sm:space-y-5">
                  {/* Product Info */}
                  <div className="p-3 sm:p-4 bg-muted/50 rounded-lg space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-base sm:text-lg font-semibold line-clamp-2">{challenge.product_name}</span>
                    </div>
                    {challenge.product_value && (
                      <div className="ml-7 text-lg sm:text-xl font-bold text-primary">
                        ₩{challenge.product_value.toLocaleString()}
                      </div>
                    )}
                    {/* Platforms */}
                    {challenge.platform && challenge.platform.length > 0 && (
                      <div className="flex gap-2 ml-7">
                        {challenge.platform.map((p) => (
                          <Badge key={p} variant="outline" className="capitalize text-xs">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                {/* Meta Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-full">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Deadline</div>
                      <div className="font-medium">{formatDate(challenge.application_deadline)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-full">
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Applicants</div>
                      <div className="font-medium">{(challenge as any).current_applicants || 0} / {challenge.max_applicants || "∞"}</div>
                    </div>
                  </div>
                </div>

                {/* Requirements */}
                {challenge.requirements && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold mb-2">Requirements</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{challenge.requirements}</p>
                  </div>
                )}

                {/* Product Detail Link */}
                {(challenge as any).product_detail_url && (
                  <a
                    href={(challenge as any).product_detail_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Product Detail
                  </a>
                )}

                {/* Actions */}
                <div className="pt-4">
                  {isOwner ? (
                    <Button
                      variant="outline"
                      size="lg"
                      className="rounded-full w-full"
                      onClick={() => navigate(`/challenges/${challenge.id}/edit`)}
                    >
                      Edit Challenge
                    </Button>
                  ) : (
                    <>
                      {userType === "brand" ? (
                        <Button disabled size="lg" className="rounded-full w-full">
                          Brands cannot apply
                        </Button>
                      ) : hasApplied ? (
                        <Button disabled variant="secondary" size="lg" className="rounded-full w-full">
                          Already Applied
                        </Button>
                      ) : (
                        <Button onClick={handleApply} size="lg" className="rounded-full w-full text-lg py-6">
                          Apply Now
                        </Button>
                      )}
                    </>
                  )}
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Applications (only for owner) */}
        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle>Applications ({applications.length})</CardTitle>
              <CardDescription>Manage applicants for this challenge</CardDescription>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No applications yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Creator</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Followers</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Applied</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {app.creator?.full_name || "Unknown"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {app.social_handle && `@${app.social_handle}`}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">
                            {app.social_platform || "-"}
                          </TableCell>
                          <TableCell>
                            {app.follower_count?.toLocaleString() || "-"}
                          </TableCell>
                          <TableCell>{getStatusBadge(app.status)}</TableCell>
                          <TableCell>{formatDate(app.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {app.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => openConfirmDialog(app.id, "selected")}
                                    title="Select"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => openConfirmDialog(app.id, "rejected")}
                                    title="Reject"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {app.status === "selected" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => openConfirmDialog(app.id, "shipped")}
                                  title="Mark as Shipped"
                                >
                                  <Truck className="h-4 w-4" />
                                </Button>
                              )}
                              {app.status === "submitted" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-full"
                                  onClick={() => openConfirmDialog(app.id, "completed")}
                                >
                                  Complete
                                </Button>
                              )}
                              {app.content_url && (
                                <a
                                  href={app.content_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </a>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Apply Dialog */}
      {challenge && (
        <ApplyToChallengeDialog
          open={applyDialogOpen}
          onOpenChange={setApplyDialogOpen}
          challenge={challenge}
          onSuccess={() => {
            navigate("/challenges?tab=applications");
          }}
        />
      )}

      {/* Confirm Dialog for status changes */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent className="mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full"
              onClick={() => updateApplicationStatus(confirmDialog.applicationId, confirmDialog.action)}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChallengeDetail;
