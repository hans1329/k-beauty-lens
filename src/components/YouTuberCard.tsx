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
}

const YouTuberCard = ({
  id,
  name,
  channel,
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
}: YouTuberCardProps) => {
  const creatorId = id || channel.replace('@', '');
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
      </div>

      <div className="p-6 space-y-4">
        {/* Profile */}
        <div className="flex items-start gap-3">
          <Avatar className="w-12 h-12 border-2 border-primary/20">
            <AvatarImage src={thumbnail} alt={name} />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate">{name}</h3>
            <p className="text-sm text-muted-foreground truncate">{channel}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-primary" />
            <span className="font-semibold">{subscribers}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Eye className="w-4 h-4 text-secondary" />
            <span className="font-semibold">{avgViews}</span>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">AI Match Score</span>
            <span className="font-bold text-primary">{engagement}%</span>
          </div>
          <Progress value={engagement} className="h-2" />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Heart className="w-3 h-3" />
            <span>Skin Tone:</span>
            <Badge variant="outline" className="text-xs">{skinTone}</Badge>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {style.map((s, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {s}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap gap-1">
            {brands.map((brand, i) => (
              <Badge key={i} className="text-xs bg-accent/20 text-accent-foreground hover:bg-accent/30">
                {brand}
              </Badge>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Link to={`/creator/${creatorId}`} className="flex-1">
            <Button className="w-full" size="sm">
              View Analysis
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => window.open(channelUrl, '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default YouTuberCard;
