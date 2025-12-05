import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabaseService';
import { getUserRole } from '@/services/userRoleService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Crown, Sparkles, ExternalLink, CheckCircle2, Settings as SettingsIcon, Package, Zap, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { AccountManagementModal } from '@/components/AccountManagementModal';
import Header from '@/components/Header';

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  useEffect(() => {
    loadUserData();
    checkSubscriptionStatus();
    
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast.success('Subscription activated successfully!');
      setTimeout(() => checkSubscriptionStatus(), 2000);
    }
    if (params.get('pack_success') === 'true') {
      toast.success('Analysis pack purchased successfully!');
      setTimeout(() => checkSubscriptionStatus(), 2000);
    }
  }, []);

  const loadUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      const role = await getUserRole(session.user.id);
      setUserRole(role);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No active session, skipping subscription check');
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) {
        console.error('Subscription check error:', error);
        return;
      }
      
      await loadUserData();
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to start checkout process');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening portal:', error);
      toast.error('Failed to open subscription management');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchasePack = async (packType: 'topup' | 'pro' = 'topup') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('purchase-analysis-pack', {
        body: packType === 'pro' ? { pack_type: 'pro' } : {}
      });
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error purchasing pack:', error);
      toast.error('Failed to start purchase');
    } finally {
      setLoading(false);
    }
  };

  const isPremium = userRole?.role === 'premium' || userRole?.role === 'admin' || userRole?.subscription_status === 'active';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-foreground mb-2">Account Settings</h1>
          <p className="text-muted-foreground text-lg">{user?.email}</p>
        </div>

        {/* Usage Stats Card */}
        <Card className="p-6 mb-6 bg-card border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="text-primary" size={24} />
            </div>
            <h3 className="text-xl font-bold text-foreground">Usage Statistics</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isPremium && (
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Monthly Analyses</p>
                <p className="text-3xl font-black text-foreground">
                  {userRole?.monthly_analyses_used || 0}
                  <span className="text-lg text-muted-foreground font-normal">/{userRole?.monthly_analyses_limit || 10}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">Resets monthly</p>
              </div>
            )}
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-sm text-muted-foreground mb-1">Pack Analyses</p>
              <p className="text-3xl font-black text-primary">
                {userRole?.pack_analyses_remaining || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Never expires</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-sm text-muted-foreground mb-1">Account Type</p>
              <p className="text-xl font-bold text-foreground flex items-center gap-2">
                {isPremium ? (
                  <>
                    <Crown className="text-primary" size={20} />
                    Premium
                  </>
                ) : (
                  <>
                    <Sparkles className="text-muted-foreground" size={20} />
                    Free Trial
                  </>
                )}
              </p>
            </div>
          </div>
        </Card>

        {/* Account Management Card */}
        <Card className="p-6 mb-6 bg-card border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-muted rounded-lg">
              <SettingsIcon className="text-muted-foreground" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Account Management</h3>
              <p className="text-sm text-muted-foreground">Change your password or delete your account</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setAccountModalOpen(true)}
            className="w-full sm:w-auto"
          >
            <SettingsIcon size={18} className="mr-2" />
            Manage Account
          </Button>
        </Card>

        {/* Subscription Card */}
        <Card className="p-8 mb-6 bg-card border-border overflow-hidden relative">
          {isPremium && (
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-bl-lg">
              ACTIVE
            </div>
          )}
          
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${isPremium ? 'bg-primary/10' : 'bg-muted'}`}>
                {isPremium ? (
                  <Crown className="text-primary" size={32} />
                ) : (
                  <Sparkles className="text-muted-foreground" size={32} />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {isPremium ? 'Starter Plan' : 'Free Trial'}
                </h2>
                {isPremium ? (
                  <p className="text-muted-foreground">
                    10 analyses/month • Participant testing • Priority support
                    {userRole?.subscription_end && (
                      <span className="block text-sm mt-1">
                        Renews on {new Date(userRole.subscription_end).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="text-muted-foreground">Limited features • No monthly analyses</p>
                )}
              </div>
            </div>
          </div>

          {!isPremium && (
            <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-accent rounded-xl p-6 mb-6 border border-primary/20">
              <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Zap className="text-primary" size={24} />
                Upgrade to Starter
              </h3>
              <ul className="space-y-3 mb-6">
                {['10 emotion analyses per month', 'Participant testing with unlimited sessions', 'Advanced reporting and analytics', 'Priority email support'].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-foreground">
                    <CheckCircle2 size={18} className="text-primary flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-black text-foreground">€9.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <Button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
              >
                {loading ? 'Processing...' : 'Upgrade Now'}
                <ExternalLink size={18} className="ml-2" />
              </Button>
            </div>
          )}

          {isPremium && (
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Loading...' : 'Manage Subscription'}
              <ExternalLink size={18} className="ml-2" />
            </Button>
          )}
        </Card>

        {/* Analysis Packs Card */}
        <Card className="p-8 bg-card border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="text-primary" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Analysis Packs</h3>
              <p className="text-sm text-muted-foreground">Purchase packs that never expire</p>
            </div>
          </div>
          
          <div className="grid gap-4">
            {/* Pro Pack */}
            <div className="bg-gradient-to-br from-primary/5 to-accent rounded-xl p-6 border-2 border-primary">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-foreground text-lg">Pro Pack</h4>
                    <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-0.5 rounded">BEST VALUE</span>
                  </div>
                  <p className="text-sm text-muted-foreground">20 Analyses • Never expires</p>
                  {isPremium && (
                    <div className="mt-2 inline-block bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">
                      20% STARTER DISCOUNT
                    </div>
                  )}
                </div>
                <div className="text-right">
                  {isPremium ? (
                    <>
                      <div className="text-sm text-muted-foreground line-through">€24.99</div>
                      <div className="text-3xl font-black text-primary">€19.99</div>
                    </>
                  ) : (
                    <div className="text-3xl font-black text-foreground">€24.99</div>
                  )}
                  <div className="text-xs text-muted-foreground">one-time</div>
                </div>
              </div>
              <Button
                onClick={() => handlePurchasePack('pro')}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {loading ? 'Processing...' : isPremium ? 'Buy Pro Pack (20% off)' : 'Buy Pro Pack'}
                <ExternalLink size={18} className="ml-2" />
              </Button>
            </div>

            {/* Top-up Pack */}
            <div className="bg-muted/30 rounded-xl p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-foreground text-lg">Top-up Pack</h4>
                  <p className="text-sm text-muted-foreground">5 Analyses • Never expires</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-foreground">€4.99</div>
                  <div className="text-xs text-muted-foreground">one-time</div>
                </div>
              </div>
              <Button
                onClick={() => handlePurchasePack('topup')}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? 'Processing...' : 'Buy Pack'}
                <ExternalLink size={18} className="ml-2" />
              </Button>
            </div>
          </div>

          {userRole?.pack_analyses_remaining > 0 && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-sm text-green-800">
                You have <span className="font-bold">{userRole.pack_analyses_remaining}</span> pack analyses available
              </p>
            </div>
          )}
        </Card>

        <AccountManagementModal
          open={accountModalOpen}
          onOpenChange={setAccountModalOpen}
          userEmail={user?.email || ''}
        />
      </main>
    </div>
  );
};

export default Settings;