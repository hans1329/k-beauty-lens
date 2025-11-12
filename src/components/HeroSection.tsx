import { Search, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden py-20 px-6">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-hero" />
      
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-primary/20 blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-secondary/20 blur-3xl animate-float" style={{ animationDelay: "1s" }} />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">AI-Powered Beauty Creator Analytics</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Connect with
            <br />
            <span className="gradient-text">K-Beauty Creators</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover and analyze Korean beauty YouTubers through advanced AI. 
            Match your brand with the perfect creators for global success.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" className="gap-2 shadow-glow">
              <Search className="w-5 h-5" />
              Explore Creators
            </Button>
            <Button size="lg" variant="outline" className="gap-2">
              <TrendingUp className="w-5 h-5" />
              View Analytics
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 max-w-3xl mx-auto">
            <div className="glass rounded-2xl p-6 border border-border/50">
              <div className="text-3xl font-bold gradient-text">500+</div>
              <div className="text-sm text-muted-foreground mt-1">Verified Creators</div>
            </div>
            <div className="glass rounded-2xl p-6 border border-border/50">
              <div className="text-3xl font-bold gradient-text">10M+</div>
              <div className="text-sm text-muted-foreground mt-1">Total Subscribers</div>
            </div>
            <div className="glass rounded-2xl p-6 border border-border/50">
              <div className="text-3xl font-bold gradient-text">AI</div>
              <div className="text-sm text-muted-foreground mt-1">Deep Analysis</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
