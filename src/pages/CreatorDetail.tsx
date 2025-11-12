import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, TrendingUp, Users, Eye, Heart, MessageCircle, Calendar, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const CreatorDetail = () => {
  const { id } = useParams();

  // Sample detailed data - this would come from API with YouTube Data
  const creatorData = {
    name: "Jisoo Beauty",
    channel: "@jisoobeauty",
    thumbnail: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&h=400&fit=crop",
    subscribers: "2.5M",
    totalViews: "125M",
    avgViews: "850K",
    engagement: 92,
    uploadFrequency: "3-4 videos/week",
    joinedDate: "Jan 2020",
    skinTone: "Light",
    style: ["Natural", "Fresh", "Daily"],
    topBrands: [
      { name: "LANEIGE", count: 45, percentage: 28 },
      { name: "innisfree", count: 38, percentage: 24 },
      { name: "3CE", count: 32, percentage: 20 },
      { name: "ETUDE", count: 25, percentage: 16 },
      { name: "rom&nd", count: 19, percentage: 12 },
    ],
    channelUrl: "https://youtube.com",
  };

  // Video performance data
  const videoPerformance = [
    { month: "Jan", views: 820, engagement: 88 },
    { month: "Feb", views: 950, engagement: 91 },
    { month: "Mar", views: 780, engagement: 85 },
    { month: "Apr", views: 1100, engagement: 94 },
    { month: "May", views: 890, engagement: 89 },
    { month: "Jun", views: 1050, engagement: 92 },
  ];

  // Recent uploads
  const recentVideos = [
    {
      title: "Summer Glow Makeup Tutorial 2024",
      views: "1.2M",
      likes: "95K",
      comments: "2.3K",
      uploadDate: "2 days ago",
      thumbnail: "https://images.unsplash.com/photo-1596815064285-45ed8a9c0463?w=300&h=200&fit=crop",
    },
    {
      title: "My Everyday Skincare Routine",
      views: "890K",
      likes: "78K",
      comments: "1.8K",
      uploadDate: "5 days ago",
      thumbnail: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=300&h=200&fit=crop",
    },
    {
      title: "LANEIGE New Collection Review",
      views: "1.5M",
      likes: "112K",
      comments: "3.1K",
      uploadDate: "1 week ago",
      thumbnail: "https://images.unsplash.com/photo-1631214500869-2ce9e82b82f5?w=300&h=200&fit=crop",
    },
  ];

  // Sentiment analysis data
  const sentimentData = [
    { name: "Positive", value: 78, color: "hsl(var(--chart-1))" },
    { name: "Neutral", value: 18, color: "hsl(var(--chart-2))" },
    { name: "Negative", value: 4, color: "hsl(var(--chart-3))" },
  ];

  // Audience demographics
  const audienceAge = [
    { age: "13-17", percentage: 15 },
    { age: "18-24", percentage: 42 },
    { age: "25-34", percentage: 28 },
    { age: "35-44", percentage: 12 },
    { age: "45+", percentage: 3 },
  ];

  const audienceGender = [
    { name: "Female", value: 85, color: "hsl(var(--primary))" },
    { name: "Male", value: 13, color: "hsl(var(--secondary))" },
    { name: "Other", value: 2, color: "hsl(var(--accent))" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-10">
        <div className="container mx-auto max-w-7xl px-6 py-4">
          <Link to="/">
            <Button variant="ghost" className="gap-2 rounded-full">
              <ArrowLeft className="h-4 w-4" />
              Back to Creators
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Profile Header */}
        <Card className="border-border/50 backdrop-blur-sm bg-card/80 overflow-hidden">
          <div className="h-32 bg-gradient-primary"></div>
          <CardContent className="pt-0">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-16 md:-mt-12">
              <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background shadow-elegant">
                <AvatarImage src={creatorData.thumbnail} alt={creatorData.name} />
                <AvatarFallback>{creatorData.name[0]}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-4 pt-4 md:pt-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold gradient-text">{creatorData.name}</h1>
                    <p className="text-muted-foreground">{creatorData.channel}</p>
                  </div>
                  <a href={creatorData.channelUrl} target="_blank" rel="noopener noreferrer">
                    <Button className="gap-2 rounded-full">
                      <ExternalLink className="h-4 w-4" />
                      Visit Channel
                    </Button>
                  </a>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      Subscribers
                    </div>
                    <div className="text-2xl font-bold">{creatorData.subscribers}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      Total Views
                    </div>
                    <div className="text-2xl font-bold">{creatorData.totalViews}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      Avg Views
                    </div>
                    <div className="text-2xl font-bold">{creatorData.avgViews}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Award className="h-4 w-4" />
                      Engagement
                    </div>
                    <div className="text-2xl font-bold">{creatorData.engagement}%</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="rounded-full">
                    {creatorData.skinTone} Skin Tone
                  </Badge>
                  {creatorData.style.map((s) => (
                    <Badge key={s} variant="outline" className="rounded-full">
                      {s}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="rounded-full gap-1">
                    <Calendar className="h-3 w-3" />
                    {creatorData.uploadFrequency}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Analytics Tabs */}
        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 rounded-full">
            <TabsTrigger value="performance" className="rounded-full">Performance</TabsTrigger>
            <TabsTrigger value="videos" className="rounded-full">Recent Videos</TabsTrigger>
            <TabsTrigger value="brands" className="rounded-full">Brand Analysis</TabsTrigger>
            <TabsTrigger value="sentiment" className="rounded-full">Sentiment</TabsTrigger>
            <TabsTrigger value="audience" className="rounded-full">Audience</TabsTrigger>
          </TabsList>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/50 backdrop-blur-sm bg-card/80">
                <CardHeader>
                  <CardTitle>Monthly Views Trend</CardTitle>
                  <CardDescription>Average views per video over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={videoPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="views"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))" }}
                        name="Views (K)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/50 backdrop-blur-sm bg-card/80">
                <CardHeader>
                  <CardTitle>Engagement Rate Trend</CardTitle>
                  <CardDescription>Monthly engagement performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={videoPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="engagement" fill="hsl(var(--chart-1))" name="Engagement %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/50 backdrop-blur-sm bg-card/80">
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subscriber Growth</span>
                      <span className="font-semibold text-primary">+12.5%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Video Completion Rate</span>
                      <span className="font-semibold text-primary">68%</span>
                    </div>
                    <Progress value={68} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Click-Through Rate</span>
                      <span className="font-semibold text-primary">8.2%</span>
                    </div>
                    <Progress value={82} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Videos Tab */}
          <TabsContent value="videos" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentVideos.map((video, index) => (
                <Card key={index} className="border-border/50 backdrop-blur-sm bg-card/80 overflow-hidden group hover:shadow-elegant transition-all">
                  <div className="relative overflow-hidden">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="pt-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">{video.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{video.uploadDate}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span>{video.views}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4 text-muted-foreground" />
                        <span>{video.likes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4 text-muted-foreground" />
                        <span>{video.comments}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Brand Analysis Tab */}
          <TabsContent value="brands" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/50 backdrop-blur-sm bg-card/80">
                <CardHeader>
                  <CardTitle>Top Featured Brands</CardTitle>
                  <CardDescription>Brand mentions across all videos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {creatorData.topBrands.map((brand) => (
                    <div key={brand.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{brand.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {brand.count} mentions ({brand.percentage}%)
                        </span>
                      </div>
                      <Progress value={brand.percentage * 3.5} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/50 backdrop-blur-sm bg-card/80">
                <CardHeader>
                  <CardTitle>Brand Category Distribution</CardTitle>
                  <CardDescription>Types of products featured</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Skincare", value: 35 },
                          { name: "Makeup", value: 40 },
                          { name: "Haircare", value: 15 },
                          { name: "Tools", value: 10 },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                      >
                        <Cell fill="hsl(var(--chart-1))" />
                        <Cell fill="hsl(var(--chart-2))" />
                        <Cell fill="hsl(var(--chart-3))" />
                        <Cell fill="hsl(var(--chart-4))" />
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sentiment Tab */}
          <TabsContent value="sentiment" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/50 backdrop-blur-sm bg-card/80">
                <CardHeader>
                  <CardTitle>Comment Sentiment Analysis</CardTitle>
                  <CardDescription>AI-analyzed audience reactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name} ${value}%`}
                        outerRadius={100}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/50 backdrop-blur-sm bg-card/80">
                <CardHeader>
                  <CardTitle>Top Comment Themes</CardTitle>
                  <CardDescription>Most discussed topics in comments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { theme: "Product Recommendations", count: 1250, sentiment: "positive" },
                    { theme: "Tutorial Requests", count: 980, sentiment: "neutral" },
                    { theme: "Makeup Tips", count: 856, sentiment: "positive" },
                    { theme: "Skincare Advice", count: 742, sentiment: "positive" },
                    { theme: "Technique Questions", count: 634, sentiment: "neutral" },
                  ].map((item) => (
                    <div key={item.theme} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{item.theme}</p>
                        <p className="text-sm text-muted-foreground">{item.count} comments</p>
                      </div>
                      <Badge
                        variant={item.sentiment === "positive" ? "default" : "secondary"}
                        className="rounded-full"
                      >
                        {item.sentiment}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Audience Tab */}
          <TabsContent value="audience" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/50 backdrop-blur-sm bg-card/80">
                <CardHeader>
                  <CardTitle>Audience Age Distribution</CardTitle>
                  <CardDescription>Viewer demographics by age</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={audienceAge}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="age" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="percentage" fill="hsl(var(--primary))" name="Percentage %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/50 backdrop-blur-sm bg-card/80">
                <CardHeader>
                  <CardTitle>Audience Gender Distribution</CardTitle>
                  <CardDescription>Viewer demographics by gender</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={audienceGender}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name} ${value}%`}
                        outerRadius={100}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                      >
                        {audienceGender.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/50 backdrop-blur-sm bg-card/80">
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>Top viewing countries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { country: "South Korea", percentage: 45, flag: "🇰🇷" },
                    { country: "United States", percentage: 22, flag: "🇺🇸" },
                    { country: "Japan", percentage: 15, flag: "🇯🇵" },
                    { country: "China", percentage: 10, flag: "🇨🇳" },
                    { country: "Others", percentage: 8, flag: "🌍" },
                  ].map((item) => (
                    <div key={item.country} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">
                          {item.flag} {item.country}
                        </span>
                        <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                      </div>
                      <Progress value={item.percentage * 2} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CreatorDetail;
