import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

const PricingNew = () => {
  const navigate = useNavigate();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const energyPackages = [
    {
      id: "energy_10",
      name: "Starter Pack",
      energy: 10,
      price: "$4.99",
      priceValue: 4.99,
      description: "Perfect for occasional searches",
      popular: false,
    },
    {
      id: "energy_30",
      name: "Power Pack",
      energy: 30,
      price: "$12.99",
      priceValue: 12.99,
      description: "Best value for regular users",
      popular: true,
    },
    {
      id: "energy_100",
      name: "Pro Pack",
      energy: 100,
      price: "$39.99",
      priceValue: 39.99,
      description: "For power users and teams",
      popular: false,
    },
  ];

  const handlePurchase = async (packageId: string, energy: number, price: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in to purchase energy");
      navigate("/auth");
      return;
    }

    setPurchasing(packageId);
    
    try {
      // Get current purchased energy
      const { data: profile } = await supabase
        .from('profiles')
        .select('purchased_energy')
        .eq('id', session.user.id)
        .single();

      const currentEnergy = (profile as any)?.purchased_energy || 0;

      // Add purchased energy to user profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          purchased_energy: currentEnergy + energy
        })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      // Record purchase in history
      const { error: insertError } = await supabase
        .from('energy_purchases' as any)
        .insert({
          user_id: session.user.id,
          energy_amount: energy,
          price_paid: price,
          payment_method: 'demo',
          transaction_id: `demo_${Date.now()}`
        });

      if (insertError) throw insertError;

      toast.success("Energy Purchased!", {
        description: `${energy} energy has been added to your account`
      });
      
      // Reload page to update energy display
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error purchasing energy:", error);
      toast.error("Purchase Failed", {
        description: "Please try again later"
      });
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto max-w-7xl px-6 py-12">
        <div className="space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="mb-4 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="inline-flex items-center gap-2 mb-4">
              <Zap className="h-8 w-8 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold gradient-text">
                Buy Energy
              </h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Purchase additional energy to search more creators and explore unlimited profiles. Energy never expires.
            </p>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="text-center">
              <CardContent className="pt-6">
                <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Daily Reset</h3>
                <p className="text-sm text-muted-foreground">
                  Free energy resets at midnight every day
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary mb-2">13</div>
                <h3 className="font-semibold mb-1">Daily Free Energy</h3>
                <p className="text-sm text-muted-foreground">
                  All users get 13 free energy daily
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary mb-2">∞</div>
                <h3 className="font-semibold mb-1">Never Expires</h3>
                <p className="text-sm text-muted-foreground">
                  Purchased energy stays in your account
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Energy Packages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {energyPackages.map((pkg) => (
              <Card
                key={pkg.id}
                className={pkg.popular ? "border-primary shadow-lg scale-105" : ""}
              >
                {pkg.popular && (
                  <div className="bg-primary text-primary-foreground text-center py-1 text-sm font-semibold rounded-t-lg">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                  <CardDescription>{pkg.description}</CardDescription>
                  <div className="pt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">{pkg.price}</span>
                      <span className="text-muted-foreground">one-time</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-primary">
                      <Zap className="h-5 w-5" />
                      <span className="text-2xl font-bold">{pkg.energy}</span>
                      <span className="text-sm">Energy</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    className="w-full"
                    variant={pkg.popular ? "default" : "outline"}
                    onClick={() => handlePurchase(pkg.id, pkg.energy, pkg.priceValue)}
                    disabled={purchasing === pkg.id}
                  >
                    {purchasing === pkg.id ? "Processing..." : "Purchase Now"}
                  </Button>
                  <div className="text-center text-sm text-muted-foreground">
                    ${(pkg.priceValue / pkg.energy).toFixed(2)} per energy
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* FAQ Section */}
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">How does energy work?</h4>
                <p className="text-sm text-muted-foreground">
                  Each action like searching a creator or visiting a profile consumes energy. You get 13 free energy daily that resets at midnight.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Does purchased energy expire?</h4>
                <p className="text-sm text-muted-foreground">
                  No, purchased energy never expires and stays in your account until you use it.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Can I refund purchased energy?</h4>
                <p className="text-sm text-muted-foreground">
                  Unused energy can be refunded within 7 days of purchase. Contact support for assistance.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PricingNew;
