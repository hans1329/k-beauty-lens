import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MessageSquare, Users, Target } from "lucide-react";
import { Link } from "react-router-dom";

const About = () => {
  const values = [
    {
      icon: Users,
      title: "Creator First",
      description: "We believe in empowering beauty creators with data-driven insights.",
    },
    {
      icon: Target,
      title: "Data Accuracy",
      description: "Our AI-powered analytics ensure the most accurate creator metrics.",
    },
    {
      icon: MessageSquare,
      title: "Transparency",
      description: "Clear, honest communication about pricing, features, and capabilities.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto max-w-7xl px-6 py-12">
        <div className="space-y-16">
          {/* Hero Section */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold gradient-text">
              About Link·kbeauty
            </h1>
            <p className="text-muted-foreground text-lg">
              We're revolutionizing how brands discover and connect with Korean beauty creators through AI-powered analytics and insights.
            </p>
          </div>

          {/* Mission Section */}
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-center">Our Mission</h2>
            <p className="text-muted-foreground text-lg text-center">
              Link·kbeauty bridges the gap between brands and K-beauty creators by providing comprehensive data analytics, ROI predictions, and actionable insights. We make influencer marketing more transparent, efficient, and results-driven.
            </p>
          </div>

          {/* Values */}
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-center">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {values.map((value) => {
                const Icon = value.icon;
                return (
                  <Card key={value.title}>
                    <CardContent className="pt-6 text-center space-y-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold">{value.title}</h3>
                      <p className="text-muted-foreground">{value.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-primary/5 rounded-lg p-8 md:p-12 text-center space-y-6">
            <h2 className="text-3xl font-bold">Get in Touch</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Have questions or want to learn more about how Link·kbeauty can help your brand? We'd love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <a href="mailto:hello@linkkbeauty.com">
                  <Mail className="mr-2 h-5 w-5" />
                  Email Us
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/auth">
                  Get Started
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;
