import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Plus, Search, Users, CreditCard, Activity, UserCheck } from 'lucide-react';
import { getUserRole } from '@/services/userRoleService';

interface UserStats {
  id: string;
  email: string;
  name: string;
  joined_at: string;
  role: 'free' | 'premium' | 'admin';
  subscription_status: string | null;
  analyses_used: number;
  monthly_analyses_used: number;
  monthly_analyses_limit: number;
  pack_analyses_remaining: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  projects_count: number;
}

interface StripeData {
  totalPaid: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserStats[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserStats[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [stripeData, setStripeData] = useState<Record<string, StripeData>>({});
  const [selectedUser, setSelectedUser] = useState<UserStats | null>(null);
  const [creditAmount, setCreditAmount] = useState<number>(0);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (u) =>
            u.email.toLowerCase().includes(query) ||
            u.name?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, users]);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/');
        return;
      }

      const role = await getUserRole(session.user.id);
      if (role?.role !== 'admin') {
        toast.error('Access denied. Admin only.');
        navigate('/');
        return;
      }

      loadUsers();
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/');
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch profiles with user_roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .neq('email', 'me@marcovanhout.com')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user_roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Fetch project counts
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('user_id');

      if (projectsError) throw projectsError;

      // Combine data
      const userStats: UserStats[] = profiles.map((profile) => {
        const role = roles.find((r) => r.user_id === profile.id);
        const projectCount = projects.filter((p) => p.user_id === profile.id).length;

        return {
          id: profile.id,
          email: profile.email,
          name: profile.name || 'Unknown',
          joined_at: profile.created_at,
          role: (role?.role || 'free') as 'free' | 'premium' | 'admin',
          subscription_status: role?.subscription_status || null,
          analyses_used: role?.analyses_used || 0,
          monthly_analyses_used: role?.monthly_analyses_used || 0,
          monthly_analyses_limit: role?.monthly_analyses_limit || 3,
          pack_analyses_remaining: role?.pack_analyses_remaining || 0,
          stripe_customer_id: role?.stripe_customer_id || null,
          stripe_subscription_id: role?.stripe_subscription_id || null,
          projects_count: projectCount,
        };
      });

      setUsers(userStats);
      
      // Fetch Stripe data for users with customer IDs
      userStats.forEach(user => {
        if (user.stripe_customer_id) {
          fetchStripeData(user.id, user.stripe_customer_id);
        }
      });
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStripeData = async (userId: string, customerId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-customer-total', {
        body: { customerId }
      });

      if (error) throw error;

      setStripeData(prev => ({
        ...prev,
        [userId]: { totalPaid: data.totalPaid || 0 }
      }));
    } catch (error) {
      console.error('Error fetching Stripe data:', error);
    }
  };

  const handleAddCredits = async (userId: string, amount: number) => {
    try {
      const { error } = await supabase.functions.invoke('admin-add-credits', {
        body: { userId, amount }
      });

      if (error) throw error;

      toast.success(`Added ${amount} credits`);
      loadUsers();
      setSelectedUser(null);
      setCreditAmount(0);
    } catch (error) {
      console.error('Error adding credits:', error);
      toast.error('Failed to add credits');
    }
  };

  const handleSendEmail = async (email: string) => {
    // This would open the user's default email client
    window.location.href = `mailto:${email}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.projects_count > 0).length;
  const premiumUsers = users.filter(u => u.role === 'premium').length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Users Management</h1>
              <p className="text-muted-foreground">Manage user accounts, roles, and view user activity</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Premium Subscribers</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{premiumUsers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>View and manage all user accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading users...</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Total Paid</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.email}</span>
                            <span className="text-sm text-muted-foreground">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'premium' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                          }`}>
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <span>{user.monthly_analyses_used}/{user.monthly_analyses_limit} monthly</span>
                            <span className="text-muted-foreground">{user.pack_analyses_remaining} pack</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(user.joined_at)}
                        </TableCell>
                        <TableCell>
                          {stripeData[user.id] ? (
                            <span className="font-medium">€{(stripeData[user.id].totalPaid / 100).toFixed(2)}</span>
                          ) : (
                            <span className="text-muted-foreground">€0.00</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendEmail(user.email)}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setCreditAmount(5);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Credits
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Credits Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Add Credits</CardTitle>
                <CardDescription>Add pack credits for {selectedUser.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Credit Amount</label>
                  <Input
                    type="number"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(Number(e.target.value))}
                    min={1}
                    placeholder="Enter amount"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAddCredits(selectedUser.id, creditAmount)}
                    className="flex-1"
                  >
                    Add Credits
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedUser(null);
                      setCreditAmount(0);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
