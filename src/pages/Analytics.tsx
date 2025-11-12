import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Eye } from "lucide-react";

const Analytics = () => {
  const stats = [
    {
      title: "Total Creators",
      value: "1,234",
      change: "+12.5%",
      icon: Users,
    },
    {
      title: "Total Views",
      value: "45.2M",
      change: "+8.3%",
      icon: Eye,
    },
    {
      title: "Avg Engagement",
      value: "4.8%",
      change: "+2.1%",
      icon: TrendingUp,
    },
    {
      title: "Active Campaigns",
      value: "89",
      change: "+15.2%",
      icon: BarChart3,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto max-w-7xl px-6 py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold gradient-text">Analytics Dashboard</h1>
            <p className="text-muted-foreground text-lg">
              Track performance metrics and insights across all beauty creators
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600">{stat.change}</span> from last month
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Coming Soon Section */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>
                More detailed analytics and reporting features coming soon
              </CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              We're building advanced analytics features including:
              <ul className="list-disc list-inside mt-4 space-y-2">
                <li>Real-time performance tracking</li>
                <li>Custom report generation</li>
                <li>Competitor benchmarking</li>
                <li>Audience demographics analysis</li>
                <li>ROI predictions and forecasting</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
