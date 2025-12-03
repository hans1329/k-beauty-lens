import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Youtube, Instagram } from "lucide-react";

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

interface SocialAccount {
  tiktok_username: string | null;
  tiktok_id: string | null;
  tiktok_follower_count: number | null;
  tiktok_verified_at: string | null;
  instagram_username: string | null;
  instagram_id: string | null;
  instagram_follower_count: number | null;
  instagram_verified_at: string | null;
  youtube_channel_id: string | null;
  youtube_channel_name: string | null;
  youtube_subscriber_count: number | null;
  youtube_verified_at: string | null;
}

interface Props {
  userId: string;
  socialAccounts: SocialAccount;
  onUpdate: (accounts: SocialAccount) => void;
}

export const SocialAccountVerification = ({ userId, socialAccounts, onUpdate }: Props) => {
  const [verifying, setVerifying] = useState<string | null>(null);
  const [inputs, setInputs] = useState({
    tiktok: socialAccounts.tiktok_username || "",
    instagram: socialAccounts.instagram_username || "",
    youtube: socialAccounts.youtube_channel_id || "",
  });

  const verifyTikTok = async () => {
    if (!inputs.tiktok.trim()) {
      toast.error("Please enter your TikTok username");
      return;
    }

    setVerifying("tiktok");
    try {
      const cleanUsername = inputs.tiktok.replace(/^@/, "").trim();
      
      const { data, error } = await supabase.functions.invoke("tiktok-search", {
        body: { username: cleanUsername },
      });

      if (error) throw error;

      const user = data?.results?.[0];
      if (!user) {
        toast.error("TikTok account not found");
        return;
      }

      // Update profile with TikTok info
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          tiktok_username: user.uniqueId || cleanUsername,
          tiktok_id: user.id,
          tiktok_follower_count: user.followerCount,
          tiktok_verified_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      onUpdate({
        ...socialAccounts,
        tiktok_username: user.uniqueId || cleanUsername,
        tiktok_id: user.id,
        tiktok_follower_count: user.followerCount,
        tiktok_verified_at: new Date().toISOString(),
      });

      toast.success(`TikTok account @${user.uniqueId || cleanUsername} verified! (${user.followerCount?.toLocaleString()} followers)`);
    } catch (error) {
      console.error("TikTok verification error:", error);
      toast.error("Failed to verify TikTok account");
    } finally {
      setVerifying(null);
    }
  };

  const verifyInstagram = async () => {
    if (!inputs.instagram.trim()) {
      toast.error("Please enter your Instagram username");
      return;
    }

    setVerifying("instagram");
    try {
      const cleanUsername = inputs.instagram.replace(/^@/, "").trim();
      
      const { data, error } = await supabase.functions.invoke("instagram-search", {
        body: { username: cleanUsername },
      });

      if (error) throw error;

      if (!data?.result) {
        toast.error("Instagram account not found");
        return;
      }

      const user = data.result;

      // Update profile with Instagram info
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          instagram_username: user.username || cleanUsername,
          instagram_id: user.id,
          instagram_follower_count: user.followerCount,
          instagram_verified_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      onUpdate({
        ...socialAccounts,
        instagram_username: user.username || cleanUsername,
        instagram_id: user.id,
        instagram_follower_count: user.followerCount,
        instagram_verified_at: new Date().toISOString(),
      });

      toast.success(`Instagram account @${user.username || cleanUsername} verified! (${user.followerCount?.toLocaleString()} followers)`);
    } catch (error) {
      console.error("Instagram verification error:", error);
      toast.error("Failed to verify Instagram account");
    } finally {
      setVerifying(null);
    }
  };

  const verifyYouTube = async () => {
    if (!inputs.youtube.trim()) {
      toast.error("Please enter your YouTube channel URL or ID");
      return;
    }

    setVerifying("youtube");
    try {
      // Extract channel identifier from URL or use as-is
      let channelInput = inputs.youtube.trim();
      
      // Handle various YouTube URL formats
      const urlMatch = channelInput.match(/youtube\.com\/(channel\/|c\/|@|user\/)?([^\/\?]+)/);
      if (urlMatch) {
        channelInput = urlMatch[2];
      }

      const { data, error } = await supabase.functions.invoke("youtube-sync", {
        body: { channelId: channelInput },
      });

      if (error) throw error;

      if (!data?.channel) {
        toast.error("YouTube channel not found");
        return;
      }

      const channel = data.channel;

      // Update profile with YouTube info
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          youtube_channel_id: channel.channel_id,
          youtube_channel_name: channel.channel_name,
          youtube_subscriber_count: channel.subscriber_count,
          youtube_verified_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      onUpdate({
        ...socialAccounts,
        youtube_channel_id: channel.channel_id,
        youtube_channel_name: channel.channel_name,
        youtube_subscriber_count: channel.subscriber_count,
        youtube_verified_at: new Date().toISOString(),
      });

      toast.success(`YouTube channel "${channel.channel_name}" verified! (${channel.subscriber_count?.toLocaleString()} subscribers)`);
    } catch (error) {
      console.error("YouTube verification error:", error);
      toast.error("Failed to verify YouTube channel");
    } finally {
      setVerifying(null);
    }
  };

  const disconnectAccount = async (platform: "tiktok" | "instagram" | "youtube") => {
    try {
      const updates: Record<string, null> = {};
      
      if (platform === "tiktok") {
        updates.tiktok_username = null;
        updates.tiktok_id = null;
        updates.tiktok_follower_count = null;
        updates.tiktok_verified_at = null;
      } else if (platform === "instagram") {
        updates.instagram_username = null;
        updates.instagram_id = null;
        updates.instagram_follower_count = null;
        updates.instagram_verified_at = null;
      } else if (platform === "youtube") {
        updates.youtube_channel_id = null;
        updates.youtube_channel_name = null;
        updates.youtube_subscriber_count = null;
        updates.youtube_verified_at = null;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId);

      if (error) throw error;

      onUpdate({
        ...socialAccounts,
        ...updates,
      } as SocialAccount);

      setInputs(prev => ({ ...prev, [platform]: "" }));
      toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} account disconnected`);
    } catch (error) {
      console.error("Disconnect error:", error);
      toast.error("Failed to disconnect account");
    }
  };

  const formatFollowers = (count: number | null) => {
    if (!count) return "0";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Media Accounts</CardTitle>
        <CardDescription>
          Connect your social media accounts to verify your creator profile
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* TikTok */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TikTokIcon className="h-5 w-5" />
            <Label className="font-medium">TikTok</Label>
            {socialAccounts.tiktok_verified_at && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </Badge>
            )}
          </div>
          
          {socialAccounts.tiktok_verified_at ? (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium">@{socialAccounts.tiktok_username}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFollowers(socialAccounts.tiktok_follower_count)} followers
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => disconnectAccount("tiktok")}
                className="rounded-full"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={inputs.tiktok}
                onChange={(e) => setInputs(prev => ({ ...prev, tiktok: e.target.value }))}
                placeholder="Enter your TikTok username"
                className="flex-1"
              />
              <Button
                onClick={verifyTikTok}
                disabled={verifying === "tiktok"}
                className="rounded-full"
              >
                {verifying === "tiktok" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Verify"
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Instagram */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Instagram className="h-5 w-5" />
            <Label className="font-medium">Instagram</Label>
            {socialAccounts.instagram_verified_at && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </Badge>
            )}
          </div>
          
          {socialAccounts.instagram_verified_at ? (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium">@{socialAccounts.instagram_username}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFollowers(socialAccounts.instagram_follower_count)} followers
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => disconnectAccount("instagram")}
                className="rounded-full"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={inputs.instagram}
                onChange={(e) => setInputs(prev => ({ ...prev, instagram: e.target.value }))}
                placeholder="Enter your Instagram username"
                className="flex-1"
              />
              <Button
                onClick={verifyInstagram}
                disabled={verifying === "instagram"}
                className="rounded-full"
              >
                {verifying === "instagram" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Verify"
                )}
              </Button>
            </div>
          )}
        </div>

        {/* YouTube */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Youtube className="h-5 w-5" />
            <Label className="font-medium">YouTube</Label>
            {socialAccounts.youtube_verified_at && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </Badge>
            )}
          </div>
          
          {socialAccounts.youtube_verified_at ? (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium">{socialAccounts.youtube_channel_name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFollowers(socialAccounts.youtube_subscriber_count)} subscribers
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => disconnectAccount("youtube")}
                className="rounded-full"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={inputs.youtube}
                onChange={(e) => setInputs(prev => ({ ...prev, youtube: e.target.value }))}
                placeholder="Channel URL or @handle"
                className="flex-1"
              />
              <Button
                onClick={verifyYouTube}
                disabled={verifying === "youtube"}
                className="rounded-full"
              >
                {verifying === "youtube" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Verify"
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
