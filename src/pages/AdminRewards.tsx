import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

const AdminRewards = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(5);

  useEffect(() => {
    loadRewardSettings();
  }, []);

  const loadRewardSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reward_settings')
        .select('setting_value')
        .eq('setting_key', 'daily_completion_reward')
        .single();

      if (error) throw error;
      if (data) {
        setRewardAmount(data.setting_value);
      }
    } catch (error) {
      console.error('Error loading reward settings:', error);
      toast.error("Failed to load reward settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (rewardAmount < 0) {
      toast.error("Reward amount cannot be negative");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('reward_settings')
        .update({ setting_value: rewardAmount })
        .eq('setting_key', 'daily_completion_reward');

      if (error) throw error;
      toast.success("Reward settings saved successfully");
    } catch (error) {
      console.error('Error saving reward settings:', error);
      toast.error("Failed to save reward settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reward Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure energy rewards for user activities
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Daily Completion Reward</CardTitle>
              <CardDescription>
                Energy reward given to users when they complete their daily quota (use all 13 energy)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reward-amount">Reward Energy Amount</Label>
                <Input
                  id="reward-amount"
                  type="number"
                  min="0"
                  value={rewardAmount}
                  onChange={(e) => setRewardAmount(parseInt(e.target.value) || 0)}
                  className="max-w-xs"
                />
                <p className="text-sm text-muted-foreground">
                  Users will receive this amount of bonus energy when they use all their daily energy
                </p>
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="rounded-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRewards;
