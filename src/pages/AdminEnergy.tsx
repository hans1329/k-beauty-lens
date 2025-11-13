import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Zap, Save } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";

interface EnergyCost {
  id: string;
  action_type: string;
  cost: number;
  description: string | null;
}

const AdminEnergy = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [energyCosts, setEnergyCosts] = useState<EnergyCost[]>([]);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      navigate("/");
      return;
    }

    setIsAdmin(true);
    await loadEnergyCosts();
  };

  const loadEnergyCosts = async () => {
    try {
      const { data, error } = await supabase
        .from('energy_costs' as any)
        .select('*')
        .order('action_type');

      if (error) throw error;
      setEnergyCosts((data as any) || []);
    } catch (error) {
      console.error("Error loading energy costs:", error);
      toast.error("Failed to load energy costs");
    } finally {
      setLoading(false);
    }
  };

  const handleCostChange = (id: string, newCost: number) => {
    setEnergyCosts(prev => 
      prev.map(item => 
        item.id === id ? { ...item, cost: newCost } : item
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const item of energyCosts) {
        const { error } = await supabase
          .from('energy_costs' as any)
          .update({ cost: item.cost })
          .eq('id', item.id);

        if (error) throw error;
      }

      toast.success("Energy costs updated successfully");
    } catch (error) {
      console.error("Error saving energy costs:", error);
      toast.error("Failed to save energy costs");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'search':
        return 'Search Creator';
      case 'visit_creator':
        return 'Visit Creator Page';
      default:
        return actionType;
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">Energy Settings</h1>
          <p className="text-muted-foreground">
            Configure energy costs for different user actions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Energy Cost Configuration
            </CardTitle>
            <CardDescription>
              Set how much energy each action costs. Total daily energy is 13.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {energyCosts.map((item) => (
              <div key={item.id} className="space-y-2">
                <Label htmlFor={item.action_type}>
                  {getActionLabel(item.action_type)}
                </Label>
                {item.description && (
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                )}
                <Input
                  id={item.action_type}
                  type="number"
                  min="0"
                  max="13"
                  value={item.cost}
                  onChange={(e) => handleCostChange(item.id, parseInt(e.target.value) || 0)}
                  className="max-w-xs"
                />
              </div>
            ))}

            <div className="pt-4 border-t">
              <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Current Settings Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Daily Energy Limit:</span>
                <span className="font-semibold">13</span>
              </div>
              {energyCosts.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-muted-foreground">{getActionLabel(item.action_type)}:</span>
                  <span className="font-semibold">{item.cost} energy</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminEnergy;
