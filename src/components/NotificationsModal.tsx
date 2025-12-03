import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Trophy, Package, CheckCircle, XCircle, Truck, Loader2 } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

interface NotificationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const NotificationsModal = ({ open, onOpenChange, userId }: NotificationsModalProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && userId) {
      loadNotifications();
    }
  }, [open, userId]);

  const loadNotifications = async () => {
    setLoading(true);
    
    // Load challenge applications for creators
    const { data: applications } = await supabase
      .from("challenge_applications")
      .select("*, challenges(title, product_name)")
      .eq("creator_id", userId)
      .order("updated_at", { ascending: false })
      .limit(20);

    // Load challenges for brands (applications received)
    const { data: brandChallenges } = await supabase
      .from("challenges")
      .select("id, title")
      .eq("brand_id", userId);

    let brandNotifications: Notification[] = [];
    if (brandChallenges && brandChallenges.length > 0) {
      const challengeIds = brandChallenges.map(c => c.id);
      const { data: receivedApplications } = await supabase
        .from("challenge_applications")
        .select("*, challenges(title), profiles!challenge_applications_creator_id_fkey(full_name)")
        .in("challenge_id", challengeIds)
        .order("created_at", { ascending: false })
        .limit(20);

      if (receivedApplications) {
        brandNotifications = receivedApplications.map((app: any) => ({
          id: `brand-${app.id}`,
          type: "application_received",
          title: "New Application",
          message: `${app.profiles?.full_name || "A creator"} applied to "${app.challenges?.title}"`,
          created_at: app.created_at,
          is_read: false,
        }));
      }
    }

    // Transform applications to notifications
    const creatorNotifications: Notification[] = (applications || []).map((app: any) => {
      let type = "application";
      let title = "Application Update";
      let message = "";

      switch (app.status) {
        case "pending":
          type = "pending";
          title = "Application Submitted";
          message = `Your application for "${app.challenges?.title}" is pending review`;
          break;
        case "selected":
          type = "selected";
          title = "You've Been Selected!";
          message = `Congratulations! You've been selected for "${app.challenges?.title}"`;
          break;
        case "rejected":
          type = "rejected";
          title = "Application Not Selected";
          message = `Your application for "${app.challenges?.title}" was not selected`;
          break;
        case "shipped":
          type = "shipped";
          title = "Product Shipped";
          message = `The product for "${app.challenges?.title}" has been shipped`;
          break;
        case "completed":
          type = "completed";
          title = "Challenge Completed";
          message = `Your review for "${app.challenges?.title}" has been completed`;
          break;
      }

      return {
        id: app.id,
        type,
        title,
        message,
        created_at: app.updated_at || app.created_at,
        is_read: false,
      };
    });

    setNotifications([...brandNotifications, ...creatorNotifications].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ));
    setLoading(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "selected":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-destructive" />;
      case "shipped":
        return <Truck className="h-5 w-5 text-blue-500" />;
      case "completed":
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case "application_received":
        return <Package className="h-5 w-5 text-primary" />;
      default:
        return <Package className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] max-h-[80vh] mx-4">
        <DialogHeader>
          <DialogTitle>Notifications</DialogTitle>
          <DialogDescription>
            Your recent activity and updates
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="mx-auto h-10 w-10 mb-2 opacity-50" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {formatDate(notification.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NotificationsModal;
