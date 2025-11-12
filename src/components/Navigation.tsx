import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logoImage from "@/assets/logo_linkk.png";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: "Discover", href: "/" },
    { label: "Analytics", href: "#analytics" },
    { label: "Pricing", href: "#pricing" },
    { label: "About", href: "#about" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logoImage} alt="Linkkbeauty" className="h-8 w-8" />
            <span className="text-xl font-bold gradient-text">Linkk·beauty</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
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
                  <img src={logoImage} alt="Linkkbeauty" className="h-8 w-8" />
                  <span className="text-xl font-bold gradient-text">Linkk·beauty</span>
                </Link>

                {/* Mobile Nav Items */}
                <div className="flex flex-col gap-4">
                  {navItems.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>

                {/* Mobile Actions */}
                <div className="flex flex-col gap-3 pt-4 border-t border-border">
                  <Button variant="ghost" className="w-full justify-start" asChild onClick={() => setIsOpen(false)}>
                    <Link to="/auth">Sign In</Link>
                  </Button>
                  <Button className="w-full" asChild onClick={() => setIsOpen(false)}>
                    <Link to="/auth">Get Started</Link>
                  </Button>
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
