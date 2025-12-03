import { ExternalLink, TrendingUp, Users, Eye, Heart, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Platform icons
const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

type Platform = "youtube" | "tiktok" | "instagram";

interface YouTuberCardProps {
  id?: string;
  name: string;
  channel: string;
  customUrl?: string;
  subscribers: string;
  avgViews: string;
  engagement: number;
  skinTone: string;
  style: string[];
  brands: string[];
  thumbnail: string;
  channelUrl: string;
  isVisible?: boolean;
  onVisibilityChange?: () => void;
  variant?: 'vertical' | 'horizontal';
  platform?: Platform;
}

const PlatformIcon = ({ platform, className }: { platform: Platform; className?: string }) => {
  switch (platform) {
    case "youtube":
      return <YouTubeIcon className={className} />;
    case "tiktok":
      return <TikTokIcon className={className} />;
    case "instagram":
      return <InstagramIcon className={className} />;
  }
};

const platformColors: Record<Platform, string> = {
  youtube: "bg-red-600",
  tiktok: "bg-black",
  instagram: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400",
};

const YouTuberCard = ({
  id,
  name,
  channel,
  customUrl,
  subscribers,
  avgViews,
  engagement,
  skinTone,
  style,
  brands,
  thumbnail,
  channelUrl,
  isVisible = true,
  onVisibilityChange,
  variant = 'vertical',
  platform = 'youtube',
}: YouTuberCardProps) => {
  const creatorUrl = customUrl || id || channel;
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .single();
    
    setIsAdmin(!!data);
  };

  const toggleVisibility = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!id) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('creators')
        .update({ is_visible: !isVisible })
        .eq('id', id);

      if (error) throw error;

      toast.success(isVisible ? 'Creator hidden' : 'Creator visible');
      if (onVisibilityChange) {
        onVisibilityChange();
      }
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update visibility');
    } finally {
      setIsUpdating(false);
    }
  };
  
  if (variant === 'horizontal') {
    return (
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-glow glass border-border/50 cursor-pointer">
        <div className="flex flex-col sm:flex-row">
          {/* Thumbnail */}
          <div className="relative w-full sm:w-64 h-48 overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-primary opacity-10" />
            <img
              src={thumbnail}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute top-3 right-3 flex items-center gap-2">
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleVisibility}
                  disabled={isUpdating}
                  className="h-8 w-8 bg-background/80 hover:bg-background rounded-full shadow-elegant"
                >
                  {isVisible ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            {/* Platform Icon - Bottom Right */}
            <div className={`absolute bottom-3 right-3 w-7 h-7 rounded-full ${platformColors[platform]} flex items-center justify-center shadow-lg`}>
              <PlatformIcon platform={platform} className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 h-full">
              {/* Left section - Profile and Details */}
              <div className="flex-1 space-y-4">
                {/* Profile */}
                <div className="flex items-start gap-3">
                  <Avatar className="w-12 h-12 border-2 border-primary/20">
                    <AvatarImage src={thumbnail} alt={name} />
                    <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Link to={`/creator/${creatorUrl}`}>
                      <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                        {name}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground">{channel}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{subscribers}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{avgViews}</span>
                  </div>
                  <Badge className="bg-primary text-white border-0">
                    {engagement}% Engagement
                  </Badge>
                </div>

                {/* Engagement Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Engagement Rate</span>
                    <span className="font-medium text-primary">{engagement}%</span>
                  </div>
                  <Progress value={engagement} className="h-2" />
                </div>

                {/* Style & Brands */}
                <div className="flex flex-wrap gap-2">
                  {style.slice(0, 3).map((s, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                  {brands.slice(0, 3).map((brand, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {brand}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Right section - Actions */}
              <div className="flex flex-col gap-3 sm:items-end">
                <Link to={`/creator/${creatorUrl}`}>
                  <Button
                    variant="default"
                    size="sm"
                    className="rounded-full w-full sm:w-auto"
                  >
                    View Profile
                  </Button>
                </Link>
                <a
                  href={channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full w-full sm:w-auto"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    YouTube
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-glow glass border-border/50 cursor-pointer">
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-10" />
        <img
          src={thumbnail}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleVisibility}
              disabled={isUpdating}
              className="h-8 w-8 bg-background/80 hover:bg-background rounded-full shadow-elegant"
            >
              {isVisible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
          )}
          <Badge className="bg-primary text-white border-0 shadow-lg">
            {engagement}% Engagement
          </Badge>
        </div>
        {/* Style Tags - Bottom Left */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5 max-w-[calc(100%-60px)]">
          {style.map((s, i) => (
            <Badge key={i} variant="secondary" className="text-xs bg-background/30 backdrop-blur-sm shadow-lg">
              {s}
            </Badge>
          ))}
        </div>
        {/* Platform Icon - Bottom Right */}
        <div className={`absolute bottom-3 right-3 w-7 h-7 rounded-full ${platformColors[platform]} flex items-center justify-center shadow-lg`}>
          <PlatformIcon platform={platform} className="w-4 h-4 text-white" />
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Profile */}
        <div className="flex items-start gap-3">
          <Avatar className="w-12 h-12 border-2 border-primary/20">
            <AvatarImage src={thumbnail} alt={name} />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <Link to={`/creator/${creatorUrl}`}>
              <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                {name}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground">{channel}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-primary" />
            <span className="font-medium">{subscribers}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4 text-primary" />
            <span className="font-medium">{avgViews}</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="font-medium">{engagement}%</span>
          </div>
        </div>

        {/* Engagement Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Engagement</span>
            <span className="font-medium text-primary">{engagement}%</span>
          </div>
          <Progress value={engagement} className="h-2" />
        </div>


        {/* Brands */}
        {brands.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Featured Brands</p>
            <div className="flex flex-wrap gap-2">
              {brands.slice(0, 3).map((brand, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {brand}
                </Badge>
              ))}
              {brands.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{brands.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Link to={`/creator/${creatorUrl}`} className="flex-1">
            <Button
              variant="default"
              size="sm"
              className="w-full rounded-full"
            >
              View Profile
            </Button>
          </Link>
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </div>
    </Card>
  );
};

export default YouTuberCard;
