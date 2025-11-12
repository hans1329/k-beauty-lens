import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const Pricing = () => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      description: "Perfect for getting started",
      features: [
        "Access to 50 creator profiles",
        "Basic analytics",
        "Email support",
        "Community access",
      ],
      cta: "Get Started",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "$49",
      period: "/month",
      description: "For growing brands",
      features: [
        "Unlimited creator profiles",
        "Advanced analytics & insights",
        "ROI predictions",
        "Priority support",
        "Export reports",
        "API access",
      ],
      cta: "Start Free Trial",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large organizations",
      features: [
        "Everything in Pro",
        "Custom integrations",
        "Dedicated account manager",
        "Custom reporting",
        "SLA guarantee",
        "White-label options",
      ],
      cta: "Contact Sales",
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto max-w-7xl px-6 py-12">
        <div className="space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold gradient-text">
              Simple, Transparent Pricing
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Choose the plan that's right for your business. All plans include a 14-day free trial.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={plan.highlighted ? "border-primary shadow-lg scale-105" : ""}
              >
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                    asChild
                  >
                    <Link to="/auth">{plan.cta}</Link>
                  </Button>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto text-center space-y-4 pt-8">
            <h2 className="text-2xl font-bold">Questions?</h2>
            <p className="text-muted-foreground">
              Contact our sales team for more information about our plans and pricing.
            </p>
            <Button variant="outline" asChild>
              <Link to="/about">Contact Us</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
