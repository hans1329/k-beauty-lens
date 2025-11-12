import { BarChart3, TrendingUp, Users, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";

const StatsSection = () => {
  const stats = [
    {
      icon: Users,
      label: "Total Creators",
      value: "524",
      change: "+12% this month",
      color: "text-primary",
    },
    {
      icon: TrendingUp,
      label: "Avg. Engagement",
      value: "8.4%",
      change: "+2.3% vs industry",
      color: "text-secondary",
    },
    {
      icon: BarChart3,
      label: "Total Reach",
      value: "12.5M",
      change: "+890K this week",
      color: "text-accent",
    },
    {
      icon: Zap,
      label: "AI Analyses",
      value: "1,247",
      change: "Updated daily",
      color: "text-primary",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="glass border-border/50 p-6 hover:shadow-card transition-all duration-300"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </div>
            <div className={`p-3 rounded-xl bg-muted/50 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default StatsSection;
