import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import Navigation from "@/components/Navigation";

const VERIFIED_CHANNELS = [
  { name: "PONY Syndrome", id: "UCxv8kXBd8qEq-oXXwXsR6Rw" },
  { name: "Edward Avila", id: "UC1i-VQpB2dXZf-TsyF34SsQ" },
  { name: "Joan Kim", id: "UCbCJZT4uDBjdoiGSwODZ_lQ" },
  { name: "RISABAE", id: "UCNin3KUqjwIQjmjKcw1T-Vg" },
  { name: "Soyoon", id: "UCBmS_9qUyjH33AzlzDU2cSg" },
  { name: "씬님 (Ssin)", id: "UCDxH50RHI2dg7jJGZPc3wDQ" },
  { name: "다영 (Dayoung)", id: "UCbwVqd3BLujU5WXqiF_oCJA" },
  { name: "레오제이 (Leojay)", id: "UCGv6x0y3qkf0a8eouMAzVqw" },
];

const Admin = () => {
  const [channelId, setChannelId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [syncingChannelId, setSyncingChannelId] = useState<string | null>(null);

  const handleSync = async (channelIdToSync?: string) => {
    const targetChannelId = channelIdToSync || channelId.trim();
    
    if (!targetChannelId) {
      toast.error("Please enter a valid YouTube channel ID");
      return;
    }

    setIsLoading(true);
    if (channelIdToSync) {
      setSyncingChannelId(channelIdToSync);
    }

    try {
      const { data, error } = await supabase.functions.invoke('youtube-sync', {
        body: { channelId: targetChannelId }
      });

      if (error) {
        console.error('Sync error:', error);
        toast.error(`Failed to sync channel: ${error.message}`);
        return;
      }

      toast.success(data.message || 'Channel synced successfully!');
      if (!channelIdToSync) {
        setChannelId("");
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
      setSyncingChannelId(null);
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
                onClick={() => handleSync()}
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
              <CardTitle>Verified K-Beauty Channels</CardTitle>
              <CardDescription>
                Quick add popular K-Beauty YouTube channels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {VERIFIED_CHANNELS.map((channel) => (
                  <div
                    key={channel.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{channel.name}</p>
                      <p className="text-xs text-muted-foreground">{channel.id}</p>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        handleSync(channel.id);
                      }}
                      disabled={isLoading}
                      size="sm"
                      className="rounded-full"
                    >
                      {syncingChannelId === channel.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Quick Add
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;