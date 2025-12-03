import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Package, Clock, Users, ExternalLink, Check, X, Truck } from "lucide-react";
import Navigation from "@/components/Navigation";
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
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    applicationId: string;
    action: string;
    title: string;
    description: string;
  }>({ open: false, applicationId: "", action: "", title: "", description: "" });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Load challenge
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

    // Check if user owns this challenge
    if (challengeData.brand_id !== session.user.id) {
      toast.error("You don't have permission to view this page");
      navigate("/challenges");
      return;
    }

    setChallenge(challengeData);

    // Load applications
    const { data: appData, error: appError } = await supabase
      .from("challenge_applications")
      .select("*")
      .eq("challenge_id", id)
      .order("created_at", { ascending: false });

    if (appError) {
      console.error(appError);
    } else {
      // Get creator info for each application
      const enrichedApps = await Promise.all(
        (appData || []).map(async (app) => {
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

    setLoading(false);
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

      <main className="container mx-auto max-w-5xl px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/challenges")}
          className="mb-6 rounded-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Challenges
        </Button>

        {/* Challenge Info */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{challenge.title}</CardTitle>
                <CardDescription className="mt-2">{challenge.description}</CardDescription>
              </div>
              <Badge variant={challenge.status === "open" ? "default" : "secondary"}>
                {challenge.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{challenge.product_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Deadline: {formatDate(challenge.application_deadline)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {applications.length} / {challenge.max_applicants || "∞"} applicants
                </span>
              </div>
              {challenge.product_value && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Value: </span>
                  ₩{challenge.product_value.toLocaleString()}
                </div>
              )}
            </div>
            {(challenge as any).product_detail_url && (
              <div className="mt-4">
                <a
                  href={(challenge as any).product_detail_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Product Detail
                </a>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => navigate(`/challenges/${challenge.id}/edit`)}
              >
                Edit Challenge
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Applications */}
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
      </main>

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
