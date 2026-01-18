import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogOut, Settings, Shield, DollarSign, History, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getGameSpins, getDailyLimit, setDailyLimit, getTodaySpending, getRemainingAllowance, storeUserEmail } from '@/lib/adminConfig';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import ProfileSettings from '@/components/ProfileSettings';
import { SlotMachine } from '@/components/SlotMachine';
import { Achievements } from '@/components/Achievements';
import { Leaderboard } from '@/components/Leaderboard';

const Dashboard = () => {
  const { user, loading, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [spinHistory, setSpinHistory] = useState<any[]>([]);
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  const [dailyLimit, setDailyLimitState] = useState<number>(0);
  const [newLimit, setNewLimit] = useState('');
  const [todaySpending, setTodaySpending] = useState<number>(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      // Store user email for leaderboard
      if (user.email) {
        storeUserEmail(user.id, user.email);
      }
      
      const spins = getGameSpins();
      const userSpins = spins
        .filter((spin: any) => spin.user_id === user.id)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 20); // Show last 20 spins
      setSpinHistory(userSpins);
      
      // Load daily limit settings
      const limit = getDailyLimit(user.id);
      setDailyLimitState(limit);
      const spending = getTodaySpending(user.id);
      setTodaySpending(spending);
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleBuyCredits = async () => {
    if (!user) return;

    const purchaseAmount = parseFloat(amount);
    if (isNaN(purchaseAmount) || purchaseAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (secretKey !== 'MoldoPute') {
      toast.error('Invalid secret key');
      return;
    }

    setIsProcessing(true);
    try {
      // Get current balance
      const { data: balanceData, error: fetchError } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      let currentBalance = 0;
      if (balanceData) {
        currentBalance = balanceData.balance;
      }

      const newBalance = currentBalance + purchaseAmount;

      // Update or insert balance
      const { error: updateError } = await supabase
        .from('user_balances')
        .upsert(
          { user_id: user.id, balance: newBalance },
          { onConflict: 'user_id' }
        );

      if (updateError) throw updateError;

      toast.success(`Successfully added $${purchaseAmount} to your balance!`);
      setBuyDialogOpen(false);
      setAmount('');
      setSecretKey('');
      
      // Reload page to update balance
      window.location.reload();
    } catch (error) {
      console.error('Error buying credits:', error);
      toast.error('Failed to add credits. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetDailyLimit = () => {
    if (!user) return;

    const limitAmount = parseFloat(newLimit);
    if (isNaN(limitAmount) || limitAmount < 0) {
      toast.error('Please enter a valid limit amount');
      return;
    }

    setDailyLimit(user.id, limitAmount);
    setDailyLimitState(limitAmount);
    setLimitDialogOpen(false);
    setNewLimit('');
    
    if (limitAmount === 0) {
      toast.success('Daily spending limit removed');
    } else {
      toast.success(`Daily spending limit set to $${limitAmount}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-primary/5 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-accent/5 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 bg-card/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-bg flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">SecureAuth</span>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                variant="outline"
                onClick={() => navigate('/admin')}
                className="hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Settings className="mr-2 h-4 w-4" />
                Admin Panel
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          {/* Welcome section */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">
              Welcome back, <span className="gradient-text">{user.email?.split('@')[0]}</span>
            </h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>

          {/* Stats cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Account Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="font-semibold">Active</span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Email</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold truncate">{user.email}</p>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Member Since</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Spending Limit Card */}
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-primary" />
                    Daily Spending Limit
                  </CardTitle>
                  <CardDescription>
                    Set a responsible gambling limit for daily spending
                  </CardDescription>
                </div>
                <Dialog open={limitDialogOpen} onOpenChange={setLimitDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Settings className="mr-2 h-4 w-4" />
                      Configure
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Set Daily Spending Limit</DialogTitle>
                      <DialogDescription>
                        Configure your maximum daily spending. Set to $0 to remove the limit.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="limit">Daily Limit ($)</Label>
                        <Input
                          id="limit"
                          type="number"
                          placeholder="100"
                          value={newLimit}
                          onChange={(e) => setNewLimit(e.target.value)}
                          min="0"
                          step="1"
                        />
                        <p className="text-xs text-muted-foreground">
                          Current limit: {dailyLimit === 0 ? 'No limit' : `$${dailyLimit}`}
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setLimitDialogOpen(false);
                          setNewLimit('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        onClick={handleSetDailyLimit}
                        disabled={!newLimit}
                      >
                        Set Limit
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Current Daily Limit</p>
                  <p className="text-2xl font-bold">
                    {dailyLimit === 0 ? '∞' : `$${dailyLimit}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Today's Spending</p>
                  <p className="text-2xl font-bold">
                    ${todaySpending.toFixed(2)}
                  </p>
                </div>
                {dailyLimit > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground mb-2">Remaining Today</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${Math.min(100, (todaySpending / dailyLimit) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">
                        ${getRemainingAllowance(user.id).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Buy Credits Section */}
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Buy Credits
                  </CardTitle>
                  <CardDescription>
                    Add credits to your balance with a secret key
                  </CardDescription>
                </div>
                <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gradient-bg">
                      <DollarSign className="mr-2 h-4 w-4" />
                      Buy Credits
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Purchase Credits</DialogTitle>
                      <DialogDescription>
                        Enter the amount and secret key to add credits to your balance.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="amount">Amount ($)</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="100"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="key">Secret Key</Label>
                        <Input
                          id="key"
                          type="password"
                          placeholder="Enter secret key"
                          value={secretKey}
                          onChange={(e) => setSecretKey(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setBuyDialogOpen(false);
                          setAmount('');
                          setSecretKey('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        onClick={handleBuyCredits}
                        disabled={isProcessing || !amount || !secretKey}
                        className="gradient-bg"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Purchase'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
          </Card>

          {/* Slot Machine */}
          <SlotMachine />

          {/* Spin History */}
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <CardTitle>Spin History</CardTitle>
              </div>
              <CardDescription>
                View your past spins and results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {spinHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No spins yet. Start playing to see your history!</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Bet</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead className="text-right">Winnings</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {spinHistory.map((spin: any, index: number) => {
                        const net = spin.win_amount - spin.spin_cost;
                        const isWin = net > 0;
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              {new Date(spin.created_at).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </TableCell>
                            <TableCell>${spin.spin_cost.toFixed(2)}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {spin.result.map((symbol: string, i: number) => (
                                  <span key={i} className="text-lg">
                                    {symbol === '7' ? '7️⃣' : symbol}
                                  </span>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {spin.win_amount > 0 ? (
                                <span className="text-green-500 font-semibold">
                                  +${spin.win_amount.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">$0.00</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`font-semibold ${isWin ? 'text-green-500' : 'text-red-500'}`}>
                                {isWin ? '+' : ''}${net.toFixed(2)}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Achievements */}
          <Achievements />

          {/* Leaderboard */}
          <Leaderboard />

          {/* Profile settings */}
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                <CardTitle>Account Settings</CardTitle>
              </div>
              <CardDescription>
                Update your email address or password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileSettings />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
