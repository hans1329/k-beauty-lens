import HeroSection from "@/components/HeroSection";
import FilterBar from "@/components/FilterBar";
import YouTuberCard from "@/components/YouTuberCard";
import StatsSection from "@/components/StatsSection";

const Index = () => {
  // Sample data for demonstration
  const sampleYouTubers = [
    {
      name: "Jisoo Beauty",
      channel: "@jisoobeauty",
      subscribers: "2.5M",
      avgViews: "850K",
      engagement: 92,
      skinTone: "Light",
      style: ["Natural", "Fresh"],
      brands: ["LANEIGE", "innisfree", "3CE"],
      thumbnail: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&h=400&fit=crop",
      channelUrl: "https://youtube.com",
    },
    {
      name: "Minji Glam",
      channel: "@minjiglam",
      subscribers: "1.8M",
      avgViews: "620K",
      engagement: 88,
      skinTone: "Medium",
      style: ["Glam", "Editorial"],
      brands: ["HERA", "Sulwhasoo", "MISSHA"],
      thumbnail: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop",
      channelUrl: "https://youtube.com",
    },
    {
      name: "Soyeon Soft",
      channel: "@soyeonsoft",
      subscribers: "3.2M",
      avgViews: "1.1M",
      engagement: 95,
      skinTone: "Light",
      style: ["Soft", "Romantic"],
      brands: ["ETUDE", "Peripera", "rom&nd"],
      thumbnail: "https://images.unsplash.com/photo-1596815064285-45ed8a9c0463?w=400&h=400&fit=crop",
      channelUrl: "https://youtube.com",
    },
    {
      name: "Hana Chic",
      channel: "@hanachic",
      subscribers: "980K",
      avgViews: "340K",
      engagement: 85,
      skinTone: "Tan",
      style: ["Chic", "Bold"],
      brands: ["MAC", "Clio", "VDL"],
      thumbnail: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
      channelUrl: "https://youtube.com",
    },
    {
      name: "Yuna Everyday",
      channel: "@yunaeveryday",
      subscribers: "1.5M",
      avgViews: "580K",
      engagement: 90,
      skinTone: "Light",
      style: ["Natural", "Daily"],
      brands: ["COSRX", "Some By Mi", "Banila Co"],
      thumbnail: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
      channelUrl: "https://youtube.com",
    },
    {
      name: "Chaeyoung Pro",
      channel: "@chaeyoungpro",
      subscribers: "720K",
      avgViews: "290K",
      engagement: 82,
      skinTone: "Medium",
      style: ["Professional", "Tutorial"],
      brands: ["NARS", "Bobbi Brown", "Espoir"],
      thumbnail: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop",
      channelUrl: "https://youtube.com",
    },
  ];

  return (
    <div className="min-h-screen">
      <HeroSection />
      
      <div className="container mx-auto max-w-7xl px-6 py-12 space-y-12">
        {/* Platform Stats */}
        <StatsSection />

        {/* Search and Filter */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Discover Creators</h2>
              <p className="text-muted-foreground mt-1">
                Browse through our curated list of Korean beauty YouTubers
              </p>
            </div>
          </div>
          
          <FilterBar />
        </div>

        {/* YouTuber Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleYouTubers.map((youtuber, index) => (
            <YouTuberCard key={index} {...youtuber} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-20">
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <div className="text-xl font-bold gradient-text">Linkkbeauty</div>
              <p className="text-sm text-muted-foreground mt-1">
                Connecting brands with K-Beauty creators
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Linkkbeauty. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
