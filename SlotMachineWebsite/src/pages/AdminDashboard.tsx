import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, LogOut, Users, DollarSign, TrendingUp, GamepadIcon, BarChart3, Settings } from 'lucide-react';
import { getGameSpins } from '@/lib/adminConfig';

const AdminDashboard = () => {
  const { user, loading, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalSpins: 0,
    totalRevenue: 0,
    totalWinnings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/admin/auth');
    }
  }, [user, loading, isAdmin, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchStats();
    }
  }, [user, isAdmin]);

  const fetchStats = async () => {
    try {
      // Fetch users from Supabase auth
      const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
      
      // Get game spins from localStorage
      const spins = getGameSpins();
      
      // Calculate stats
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentSpins = spins.filter((spin: any) => new Date(spin.created_at) > sevenDaysAgo);
      const activeUserIds = new Set(recentSpins.map((spin: any) => spin.user_id));
      
      const totalRevenue = spins.reduce((sum: number, spin: any) => sum + (spin.spin_cost || 0), 0);
      const totalWinnings = spins.reduce((sum: number, spin: any) => sum + (spin.win_amount || 0), 0);

      setStats({
        totalUsers: users?.length || 0,
        activeUsers: activeUserIds.size,
        totalSpins: spins.length,
        totalRevenue,
        totalWinnings,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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

  const netRevenue = stats.totalRevenue - stats.totalWinnings;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-bg flex items-center justify-center">
              <GamepadIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground">Slot Machine Management</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/admin/users">
              <Button variant="outline" size="sm">
                <Users className="mr-2 h-4 w-4" />
                Users
              </Button>
            </Link>
            <Link to="/admin/settings">
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
            <Link to="/admin/analytics">
              <Button variant="outline" size="sm">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={handleSignOut}
              size="sm"
              className="hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8 animate-fade-in">
          {/* Welcome section */}
          <div>
            <h2 className="text-3xl font-bold">Welcome back, Admin</h2>
            <p className="text-muted-foreground mt-1">
              Here's an overview of your slot machine platform
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="glass">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.activeUsers} active in last 7 days
                </p>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Spins
                  </CardTitle>
                  <GamepadIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSpins.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all players
                </p>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Revenue
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  From spin costs
                </p>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Net Revenue
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${netRevenue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ${netRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Revenue - Winnings
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Link to="/admin/users">
                <Card className="glass hover:bg-accent/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      User Management
                    </CardTitle>
                    <CardDescription>
                      View and manage all players, block accounts, reset balances
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link to="/admin/settings">
                <Card className="glass hover:bg-accent/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Game Settings
                    </CardTitle>
                    <CardDescription>
                      Configure spin costs, payout ratios, and win multipliers
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link to="/admin/analytics">
                <Card className="glass hover:bg-accent/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Game Analytics
                    </CardTitle>
                    <CardDescription>
                      View detailed charts, trends, and player leaderboards
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
