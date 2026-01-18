import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { getGameSpins, getGameSettings } from '@/lib/adminConfig';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface SpinData {
  user_id: string;
  spin_cost: number;
  win_amount: number;
  created_at: string;
  result: string[];
}

interface DailyData {
  date: string;
  spins: number;
  revenue: number;
  winnings: number;
  netRevenue: number;
}

interface TopPlayer {
  email: string;
  totalSpins: number;
  totalWinnings: number;
  netSpend: number;
}

const AdminAnalytics = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [outcomeDistribution, setOutcomeDistribution] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/admin/auth');
    }
  }, [user, loading, isAdmin, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchAnalytics();
    }
  }, [user, isAdmin]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const spins: SpinData[] = getGameSpins();
      const settings = getGameSettings();

      // Fetch users for email mapping
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const userMap = new Map<string, string>();
      if (users) {
        users.forEach((u: any) => {
          if (u.id && u.email) {
            userMap.set(u.id, u.email);
          }
        });
      }

      // Process daily data for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const dailyMap = new Map<string, DailyData>();
      
      spins.forEach(spin => {
        const spinDate = new Date(spin.created_at);
        if (spinDate < thirtyDaysAgo) return;

        const dateKey = spinDate.toISOString().split('T')[0];
        
        if (!dailyMap.has(dateKey)) {
          dailyMap.set(dateKey, {
            date: dateKey,
            spins: 0,
            revenue: 0,
            winnings: 0,
            netRevenue: 0,
          });
        }

        const dayData = dailyMap.get(dateKey)!;
        dayData.spins++;
        dayData.revenue += spin.spin_cost;
        dayData.winnings += spin.win_amount;
        dayData.netRevenue = dayData.revenue - dayData.winnings;
      });

      const sortedDaily = Array.from(dailyMap.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(d => ({
          ...d,
          date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        }));

      setDailyData(sortedDaily);

      // Process top players
      const playerMap = new Map<string, { totalSpins: number; totalWinnings: number; totalSpent: number }>();
      
      spins.forEach(spin => {
        if (!playerMap.has(spin.user_id)) {
          playerMap.set(spin.user_id, {
            totalSpins: 0,
            totalWinnings: 0,
            totalSpent: 0,
          });
        }

        const playerData = playerMap.get(spin.user_id)!;
        playerData.totalSpins++;
        playerData.totalWinnings += spin.win_amount;
        playerData.totalSpent += spin.spin_cost;
      });

      const topPlayersList: TopPlayer[] = Array.from(playerMap.entries())
        .map(([userId, data]) => ({
          email: userMap.get(userId) || 'Unknown',
          totalSpins: data.totalSpins,
          totalWinnings: data.totalWinnings,
          netSpend: data.totalSpent - data.totalWinnings,
        }))
        .sort((a, b) => b.totalSpins - a.totalSpins)
        .slice(0, 10);

      setTopPlayers(topPlayersList);

      // Process outcome distribution
      const outcomeMap = new Map<string, number>();
      const winCounts = {
        jackpot: 0,
        threeMatch: 0,
        twoMatch: 0,
        loss: 0,
      };

      spins.forEach(spin => {
        if (spin.win_amount === 0) {
          winCounts.loss++;
        } else if (spin.result.every(r => r === '7')) {
          winCounts.jackpot++;
        } else if (spin.result[0] === spin.result[1] && spin.result[1] === spin.result[2]) {
          winCounts.threeMatch++;
        } else {
          winCounts.twoMatch++;
        }
      });

      const outcomeData = [
        { name: 'Jackpot', value: winCounts.jackpot, color: '#FFD700' },
        { name: 'Three Match', value: winCounts.threeMatch, color: '#4CAF50' },
        { name: 'Two Match', value: winCounts.twoMatch, color: '#2196F3' },
        { name: 'Loss', value: winCounts.loss, color: '#9E9E9E' },
      ];

      setOutcomeDistribution(outcomeData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const totalRevenue = dailyData.reduce((sum, d) => sum + d.revenue, 0);
  const totalWinnings = dailyData.reduce((sum, d) => sum + d.winnings, 0);
  const netRevenue = totalRevenue - totalWinnings;
  const totalSpins = dailyData.reduce((sum, d) => sum + d.spins, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold">Game Analytics</h1>
              <p className="text-xs text-muted-foreground">View detailed insights and trends</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={fetchAnalytics}
              size="sm"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6 animate-fade-in">
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Spins (30d)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSpins.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Revenue (30d)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Winnings (30d)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-500">${totalWinnings.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Net Revenue (30d)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold flex items-center gap-1 ${netRevenue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {netRevenue >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  ${netRevenue.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Daily Revenue Chart */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Daily Revenue & Winnings</CardTitle>
                <CardDescription>Last 30 days performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
                    <Line type="monotone" dataKey="winnings" stroke="#ef4444" strokeWidth={2} name="Winnings" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Outcome Distribution */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Outcome Distribution</CardTitle>
                <CardDescription>Win types breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={outcomeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {outcomeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Daily Spins Chart */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Daily Spin Activity</CardTitle>
              <CardDescription>Number of spins per day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="spins" fill="#3b82f6" name="Spins" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Players */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Top Players</CardTitle>
              <CardDescription>Most active players by spin count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPlayers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No player data available</p>
                ) : (
                  topPlayers.map((player, index) => (
                    <div key={player.email} className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{player.email}</div>
                          <div className="text-sm text-muted-foreground">{player.totalSpins} spins</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-green-500">+${player.totalWinnings.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">
                          Net: <span className={player.netSpend >= 0 ? 'text-red-500' : 'text-green-500'}>
                            ${Math.abs(player.netSpend).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminAnalytics;
