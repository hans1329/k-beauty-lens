import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogOut, User, Settings as SettingsIcon, Zap, BarChart3, Gift, Search, Shield, Trophy, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/UserAvatar";
import NotificationsModal from "@/components/NotificationsModal";
import logoImage from "@/assets/logo_linkk.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [energyUsed, setEnergyUsed] = useState(0);
  const [energyLimit, setEnergyLimit] = useState(13);
  const [purchasedEnergy, setPurchasedEnergy] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userType, setUserType] = useState<string>("general_user");
  const [fullName, setFullName] = useState<string>("");

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
        loadAvatar(session.user.id);
        loadEnergyUsage();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          checkAdminStatus(session.user.id);
          loadAvatar(session.user.id);
          loadEnergyUsage();
        } else {
          setIsAdmin(false);
          setAvatarUrl("");
          setEnergyUsed(0);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();
    
    setIsAdmin(!!data && !error);
  };

  const loadAvatar = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('avatar_url, user_type, full_name')
      .eq('id', userId)
      .single();
    
    if (data?.avatar_url) {
      setAvatarUrl(data.avatar_url);
    }
    if (data?.user_type) {
      setUserType(data.user_type);
    }
    if (data?.full_name) {
      setFullName(data.full_name);
    }
  };

  const loadEnergyUsage = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Personal daily energy limit is always 13
    setEnergyLimit(13);

    // Load daily energy usage
    const { data: quotaData } = await supabase
      .from('api_quota_usage' as any)
      .select('quota_used')
      .eq('date', new Date().toISOString().split('T')[0])
      .maybeSingle();
    
    if (quotaData) {
      setEnergyUsed((quotaData as any).quota_used);
    } else {
      setEnergyUsed(0);
    }

    // Load purchased energy
    const { data: profileData } = await supabase
      .from('profiles')
      .select('purchased_energy')
      .eq('id', session.user.id)
      .single();
    
    if (profileData) {
      setPurchasedEnergy((profileData as any).purchased_energy || 0);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      navigate("/");
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto max-w-7xl px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logoImage} alt="Link·kbeauty" className="h-8 w-8" />
            <span className="text-xl font-bold gradient-text hidden sm:inline">Link·kbeauty</span>
          </Link>

          {/* Main Navigation - Centered */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 bg-muted/50 rounded-full p-1 shadow-lg border border-border/30">
            <Button 
              variant={location.pathname === "/" || location.pathname.startsWith("/creator") || location.pathname === "/analytics" ? "default" : "ghost"} 
              asChild 
              className="rounded-full"
            >
              <Link to="/" className="flex items-center justify-center">
                <BarChart3 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Analytics</span>
              </Link>
            </Button>
            <Button 
              variant={location.pathname.startsWith("/challenges") ? "default" : "ghost"} 
              asChild 
              className="rounded-full"
            >
              <Link to="/challenges" className="flex items-center justify-center">
                <Trophy className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Challenges</span>
              </Link>
            </Button>
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full p-0 border border-gray-200">
                    <UserAvatar
                      avatarUrl={avatarUrl}
                      email={user.email}
                      size="sm"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Account</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-primary hover:text-white"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setNotificationsOpen(true);
                        }}
                      >
                        <Bell className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2 pl-1">
                        <p className="text-base font-semibold leading-none">
                          {fullName || user.user_metadata?.full_name || "User"}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-5 px-2 text-[10px] rounded-full capitalize"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate("/select-type");
                          }}
                        >
                          {userType === "general_user" ? "User" : userType}
                        </Button>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="mx-1 my-1 p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span className="text-xs font-medium text-muted-foreground">Energy</span>
                    </div>
                    <div className="relative h-6 bg-muted-foreground/30 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500"
                        style={{
                          width: `${((energyLimit - energyUsed) / energyLimit) * 100}%`,
                          backgroundSize: "200% 100%",
                          animation: "gradient-flow 3s linear infinite",
                          transition: "width 0.5s ease-out",
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-end pr-2">
                        <span className="text-xs font-semibold text-white drop-shadow-md">
                          {energyLimit - energyUsed}
                        </span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem asChild className="py-2.5">
                    <Link to="/" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Discover</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="py-2.5">
                    <Link to="/my-searches" className="cursor-pointer">
                      <Search className="mr-2 h-4 w-4" />
                      <span>My Searches</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="py-2.5">
                    <Link to="/analytics" className="cursor-pointer">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      <span>Analytics</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="py-2.5">
                    <Link to="/rewards" className="cursor-pointer">
                      <Gift className="mr-2 h-4 w-4" />
                      <span>Rewards</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="py-2.5">
                    <Link to="/pricing" className="cursor-pointer">
                      <Zap className="mr-2 h-4 w-4" />
                      <span>Energy</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="py-2.5">
                    <Link to="/settings" className="cursor-pointer">
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator className="my-2" />
                      <DropdownMenuItem asChild className="py-2.5">
                        <Link to="/admin/dashboard" className="cursor-pointer">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Admin</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="my-2" />
                  <div className="px-2 py-1.5">
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild className="rounded-full">
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>

        </div>
      </div>

      {user && (
        <NotificationsModal
          open={notificationsOpen}
          onOpenChange={setNotificationsOpen}
          userId={user.id}
        />
      )}
    </nav>
  );
};

export default Navigation;
