import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, TrendingUp, TrendingDown, Zap, Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  description: string | null;
  created_at: string;
}

const Rewards = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalUsed, setTotalUsed] = useState(0);

  useEffect(() => {
    checkAuth();
    loadTransactions();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in to view rewards");
      navigate("/auth");
    }
  };

  const loadTransactions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await (supabase as any)
        .from('energy_transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTransactions(data || []);

      // Calculate totals
      const earned = data?.filter((t: any) => ['reward', 'purchase', 'daily_reset'].includes(t.transaction_type))
        .reduce((sum: number, t: any) => sum + t.amount, 0) || 0;
      
      const used = data?.filter((t: any) => t.transaction_type === 'used')
        .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0) || 0;

      setTotalEarned(earned);
      setTotalUsed(used);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error("Failed to load energy transactions");
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'used':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'reward':
        return <Gift className="h-4 w-4 text-yellow-500" />;
      case 'purchase':
        return <Zap className="h-4 w-4 text-blue-500" />;
      case 'daily_reset':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'used':
        return 'Used';
      case 'reward':
        return 'Reward';
      case 'purchase':
        return 'Purchase';
      case 'daily_reset':
        return 'Daily Reset';
      default:
        return type;
    }
  };

  const getTransactionVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'used':
        return 'destructive';
      case 'reward':
        return 'default';
      case 'purchase':
        return 'secondary';
      case 'daily_reset':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto max-w-7xl px-6 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Energy Rewards</h1>
            <p className="text-muted-foreground mt-2">
              Track your energy usage and rewards
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      Total Earned
                    </CardTitle>
                    <CardDescription>
                      Total energy received from rewards, purchases, and daily resets
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-green-500">
                      {totalEarned}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-red-500" />
                      Total Used
                    </CardTitle>
                    <CardDescription>
                      Total energy consumed from searches and activities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-red-500">
                      {totalUsed}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>
                    All your energy transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No transactions yet. Start searching to use energy!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {getTransactionIcon(transaction.transaction_type)}
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant={getTransactionVariant(transaction.transaction_type)}>
                                  {getTransactionLabel(transaction.transaction_type)}
                                </Badge>
                                {transaction.description && (
                                  <span className="text-sm text-muted-foreground">
                                    {transaction.description}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(transaction.created_at), 'PPp')}
                              </p>
                            </div>
                          </div>
                          <div className={`text-lg font-semibold ${
                            transaction.transaction_type === 'used' ? 'text-red-500' : 'text-green-500'
                          }`}>
                            {transaction.transaction_type === 'used' ? '-' : '+'}
                            {Math.abs(transaction.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Rewards;
