import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft, Ban, CheckCircle, RefreshCw, Search } from 'lucide-react';
import { toggleBlockUser, isUserBlocked, resetUserBalance, getGameSpins } from '@/lib/adminConfig';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
  isBlocked: boolean;
  totalSpins: number;
  totalWinnings: number;
}

const AdminUserManagement = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'block' | 'unblock' | 'reset' | null>(null);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/admin/auth');
    }
  }, [user, loading, isAdmin, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchUsers();
    }
  }, [user, isAdmin]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data: { users: authUsers }, error } = await supabase.auth.admin.listUsers();
      
      if (error) throw error;

      const spins = getGameSpins();
      
      const enrichedUsers: User[] = authUsers.map(authUser => {
        const userSpins = spins.filter((spin: any) => spin.user_id === authUser.id);
        const totalWinnings = userSpins.reduce((sum: number, spin: any) => sum + (spin.win_amount || 0), 0);
        
        return {
          id: authUser.id,
          email: authUser.email || 'No email',
          created_at: authUser.created_at,
          last_sign_in_at: authUser.last_sign_in_at || authUser.created_at,
          isBlocked: isUserBlocked(authUser.id),
          totalSpins: userSpins.length,
          totalWinnings,
        };
      });

      setUsers(enrichedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlockUser = (user: User) => {
    setSelectedUser(user);
    setActionType('block');
  };

  const handleUnblockUser = (user: User) => {
    setSelectedUser(user);
    setActionType('unblock');
  };

  const handleResetBalance = (user: User) => {
    setSelectedUser(user);
    setActionType('reset');
  };

  const confirmAction = () => {
    if (!selectedUser) return;

    switch (actionType) {
      case 'block':
        toggleBlockUser(selectedUser.id, true);
        toast.success(`User ${selectedUser.email} has been blocked`);
        break;
      case 'unblock':
        toggleBlockUser(selectedUser.id, false);
        toast.success(`User ${selectedUser.email} has been unblocked`);
        break;
      case 'reset':
        resetUserBalance(selectedUser.id);
        toast.success(`Balance reset for ${selectedUser.email}`);
        break;
    }

    fetchUsers();
    setSelectedUser(null);
    setActionType(null);
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <h1 className="text-xl font-semibold">User Management</h1>
              <p className="text-xs text-muted-foreground">Manage players and accounts</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={fetchUsers}
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
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Blocked Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  {users.filter(u => u.isBlocked).length}
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {users.filter(u => !u.isBlocked).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Users</CardTitle>
                  <CardDescription>View and manage all player accounts</CardDescription>
                </div>
                <div className="w-72">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total Spins</TableHead>
                      <TableHead>Total Winnings</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.email}</TableCell>
                          <TableCell>
                            {u.isBlocked ? (
                              <Badge variant="destructive">Blocked</Badge>
                            ) : (
                              <Badge variant="default">Active</Badge>
                            )}
                          </TableCell>
                          <TableCell>{u.totalSpins}</TableCell>
                          <TableCell>${u.totalWinnings.toFixed(2)}</TableCell>
                          <TableCell>
                            {new Date(u.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {new Date(u.last_sign_in_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {u.isBlocked ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUnblockUser(u)}
                                >
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Unblock
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleBlockUser(u)}
                                  className="hover:bg-destructive hover:text-destructive-foreground"
                                >
                                  <Ban className="mr-1 h-3 w-3" />
                                  Block
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResetBalance(u)}
                              >
                                <RefreshCw className="mr-1 h-3 w-3" />
                                Reset
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Confirmation Dialog */}
      <AlertDialog open={actionType !== null} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'block' && 'Block User'}
              {actionType === 'unblock' && 'Unblock User'}
              {actionType === 'reset' && 'Reset Balance'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'block' && `Are you sure you want to block ${selectedUser?.email}? They will not be able to access the game.`}
              {actionType === 'unblock' && `Are you sure you want to unblock ${selectedUser?.email}? They will regain access to the game.`}
              {actionType === 'reset' && `Are you sure you want to reset the balance for ${selectedUser?.email}? This will set their balance to the default starting amount.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setActionType(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUserManagement;
