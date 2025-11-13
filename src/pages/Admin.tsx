import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import Navigation from "@/components/Navigation";

const VERIFIED_CHANNELS = [
  { name: "PONY Syndrome", handle: "@ponysmakeup" },
  { name: "Edward Avila", handle: "@edward_avila" },
  { name: "Joan Kim", handle: "@joankeem" },
  { name: "Soyoon", handle: "@soy00n" },
  { name: "씬님 (Ssin)", handle: "@Hines382" },
  { name: "다예 Daily Daye", handle: "@DailyDaye" },
  { name: "레오제이 (Leojay)", handle: "@leojay_" },
];

interface Creator {
  id: string;
  channel_id: string;
  channel_name: string;
  subscriber_count: number;
  video_count: number;
  thumbnail_url: string;
  last_synced_at: string;
}

const Admin = () => {
  const [channelId, setChannelId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [syncingChannelId, setSyncingChannelId] = useState<string | null>(null);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoadingCreators, setIsLoadingCreators] = useState(false);
  const [deletingCreatorId, setDeletingCreatorId] = useState<string | null>(null);

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
      
      // Reload creators list
      loadCreators();
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
      setSyncingChannelId(null);
    }
  };

  const loadCreators = async () => {
    setIsLoadingCreators(true);
    try {
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .order('last_synced_at', { ascending: false });

      if (error) throw error;
      setCreators(data || []);
    } catch (error) {
      console.error('Error loading creators:', error);
      toast.error('Failed to load creators');
    } finally {
      setIsLoadingCreators(false);
    }
  };

  useEffect(() => {
    loadCreators();
  }, []);

  const handleDeleteCreator = async (creatorId: string) => {
    if (!confirm('Are you sure you want to delete this creator and all their videos?')) {
      return;
    }

    setDeletingCreatorId(creatorId);
    try {
      const { error } = await supabase
        .from('creators')
        .delete()
        .eq('id', creatorId);

      if (error) throw error;

      toast.success('Creator deleted successfully');
      loadCreators();
    } catch (error) {
      console.error('Error deleting creator:', error);
      toast.error('Failed to delete creator');
    } finally {
      setDeletingCreatorId(null);
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
                  Channel ID, Handle, or URL
                </label>
                <Input
                  id="channelId"
                  placeholder="UCxxxxxx or @username or https://youtube.com/@username"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Accepts: Channel ID (UCxxxxx), Handle (@username), or Full URL
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
                    key={channel.handle}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{channel.name}</p>
                      <p className="text-xs text-muted-foreground">{channel.handle}</p>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        handleSync(channel.handle);
                      }}
                      disabled={isLoading}
                      size="sm"
                      className="rounded-full"
                    >
                      {syncingChannelId === channel.handle ? (
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
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Synced Creators</CardTitle>
                <CardDescription>
                  All YouTube creators currently in the database
                </CardDescription>
              </div>
              <Button
                onClick={loadCreators}
                disabled={isLoadingCreators}
                size="sm"
                variant="outline"
                className="rounded-full"
              >
                {isLoadingCreators ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingCreators ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : creators.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No creators synced yet. Add your first channel above!
                </p>
              ) : (
                <div className="grid gap-3">
                  {creators.map((creator) => (
                    <div
                      key={creator.id}
                      className="flex items-center gap-4 p-3 rounded-lg border bg-card"
                    >
                      {creator.thumbnail_url && (
                        <img
                          src={creator.thumbnail_url}
                          alt={creator.channel_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{creator.channel_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {creator.subscriber_count.toLocaleString()} subscribers • {creator.video_count} videos
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground text-right">
                          {new Date(creator.last_synced_at).toLocaleDateString()}
                        </div>
                        <Button
                          onClick={() => handleDeleteCreator(creator.id)}
                          disabled={deletingCreatorId === creator.id}
                          size="sm"
                          variant="ghost"
                          className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          {deletingCreatorId === creator.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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