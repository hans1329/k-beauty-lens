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
}

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
}: YouTuberCardProps) => {
  const creatorUrl = customUrl?.replace('@', '') || id || channel.replace('@', '');
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
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5 max-w-[calc(100%-24px)]">
          {style.map((s, i) => (
            <Badge key={i} variant="secondary" className="text-xs bg-background/30 backdrop-blur-sm shadow-lg">
              {s}
            </Badge>
          ))}
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
