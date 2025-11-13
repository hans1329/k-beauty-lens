import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, User, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const location = window.location.pathname;

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
        loadAvatar(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          checkAdminStatus(session.user.id);
          loadAvatar(session.user.id);
        } else {
          setIsAdmin(false);
          setAvatarUrl("");
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
    { label: "Pricing", href: "/pricing" },
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

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full p-0">
                    <UserAvatar
                      avatarUrl={avatarUrl}
                      email={user.email}
                      size="sm"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
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
                  <DropdownMenuItem asChild>
                    <Link to="/my-searches" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>My Searches</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button asChild className="rounded-full">
                  <Link to="/auth">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col gap-6 mt-8">
                {/* Mobile Logo */}
                <Link to="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                  <img src={logoImage} alt="Link·kbeauty" className="h-8 w-8" />
                  <span className="text-xl font-bold gradient-text">Link·kbeauty</span>
                </Link>

                {/* Mobile Nav Items */}
                <div className="flex flex-col gap-4">
                  {navItems.map((item) => {
                    const isActive = location === item.href || 
                      (item.href !== '/' && location.startsWith(item.href));
                    return (
                      <Link
                        key={item.label}
                        to={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`text-lg font-medium transition-colors py-2 ${
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

                {/* Mobile Actions */}
                <div className="flex flex-col gap-3 pt-4 border-t border-border">
                  {user ? (
                    <>
                      <div className="flex items-center gap-3 px-3 py-2">
                        <UserAvatar
                          avatarUrl={avatarUrl}
                          email={user.email}
                          size="md"
                        />
                        <div className="flex flex-col">
                          <p className="text-sm font-medium">
                            {user.user_metadata?.full_name || "User"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2"
                        asChild
                        onClick={() => setIsOpen(false)}
                      >
                        <Link to="/my-searches">
                          <User className="h-4 w-4" />
                          My Searches
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2"
                        asChild
                        onClick={() => setIsOpen(false)}
                      >
                        <Link to="/settings">
                          <SettingsIcon className="h-4 w-4" />
                          Settings
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2"
                        onClick={() => {
                          handleSignOut();
                          setIsOpen(false);
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        asChild
                        onClick={() => setIsOpen(false)}
                      >
                        <Link to="/auth">Sign In</Link>
                      </Button>
                      <Button
                        className="w-full rounded-full"
                        asChild
                        onClick={() => setIsOpen(false)}
                      >
                        <Link to="/auth">Get Started</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
