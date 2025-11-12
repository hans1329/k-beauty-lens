import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Navigation from "@/components/Navigation";

const Admin = () => {
  const [channelId, setChannelId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async () => {
    if (!channelId.trim()) {
      toast.error("Please enter a valid YouTube channel ID");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('youtube-sync', {
        body: { channelId: channelId.trim() }
      });

      if (error) {
        console.error('Sync error:', error);
        toast.error(`Failed to sync channel: ${error.message}`);
        return;
      }

      toast.success(data.message || 'Channel synced successfully!');
      setChannelId("");
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Admin Panel</h1>
            <p className="text-muted-foreground">
              Manage YouTube channels and sync creator data
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Add YouTube Channel</CardTitle>
              <CardDescription>
                Enter a YouTube channel ID to sync creator and video data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="channelId" className="text-sm font-medium">
                  Channel ID
                </label>
                <Input
                  id="channelId"
                  placeholder="UCxxxxxxxxxxxxxxxxxxxxxx"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Find the channel ID in the YouTube channel URL or page source
                </p>
              </div>

              <Button
                onClick={handleSync}
                disabled={isLoading || !channelId.trim()}
                className="w-full rounded-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  'Sync Channel'
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How to Find Channel ID</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold mb-2">Method 1: From Channel URL</h3>
                <p className="text-muted-foreground">
                  If the URL is youtube.com/channel/UCxxxxxx, the part after /channel/ is the channel ID
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Method 2: Using Username</h3>
                <p className="text-muted-foreground">
                  Go to the channel page, right-click → View Page Source, and search for "externalId"
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Example Channel IDs (K-Beauty)</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Pony Syndrome: UCxv8kXBd8qEq-oXXwXsR6Rw</li>
                  <li>Edward Avila: UC1i-VQpB2dXZf-TsyF34SsQ</li>
                  <li>Joan Kim: UCbCJZT4uDBjdoiGSwODZ_lQ</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;