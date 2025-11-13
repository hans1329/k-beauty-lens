import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, User, Settings as SettingsIcon, Zap, BarChart3, Gift, Search } from "lucide-react";
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
import logoImage from "@/assets/logo_linkk.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const Navigation = () => {
  const navigate = useNavigate();
  
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [energyUsed, setEnergyUsed] = useState(0);
  const [energyLimit, setEnergyLimit] = useState(13);
  const [purchasedEnergy, setPurchasedEnergy] = useState(0);
  const location = window.location.pathname;

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
      .select('avatar_url')
      .eq('id', userId)
      .single();
    
    if (data?.avatar_url) {
      setAvatarUrl(data.avatar_url);
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

  const baseNavItems = [
    { label: "Discover", href: "/" },
    { label: "Analytics", href: "/analytics" },
    { label: "Rewards", href: "/rewards" },
    { label: "Energy", href: "/pricing" },
    { label: "About", href: "/about" },
  ];

  const adminNavItems = [
    { label: "Admin", href: "/admin/dashboard" },
  ];

  const navItems = isAdmin ? [...baseNavItems, ...adminNavItems] : baseNavItems;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logoImage} alt="Link·kbeauty" className="h-8 w-8" />
            <span className="text-xl font-bold gradient-text">Link·kbeauty</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const isActive = location === item.href || 
                (item.href !== '/' && location.startsWith(item.href));
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive 
                      ? 'text-primary font-semibold' 
                      : 'text-foreground/80 hover:text-foreground'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full p-0 shadow-elegant">
                    <UserAvatar
                      avatarUrl={avatarUrl}
                      email={user.email}
                      size="sm"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.user_metadata?.full_name || "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
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
                    {purchasedEnergy > 0 && (
                      <div className="flex items-center justify-end mt-2">
                        <p className="text-xs font-medium text-primary">
                          +{purchasedEnergy} Energy
                        </p>
                      </div>
                    )}
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
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild className="hidden md:flex">
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button asChild className="rounded-full">
                  <Link to="/auth">Get Started</Link>
                </Button>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navigation;
