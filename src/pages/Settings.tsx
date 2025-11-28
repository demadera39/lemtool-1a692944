import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabaseService';
import { getUserRole } from '@/services/userRoleService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Crown, Sparkles, ArrowLeft, ExternalLink, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUserData();
    checkSubscriptionStatus();
    
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast.success('Subscription activated successfully! 🎉');
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
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      
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

  const isPremium = userRole?.role === 'premium';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30">
      <div className="absolute top-4 right-4 text-6xl opacity-20 rotate-12">😊</div>
      <div className="absolute bottom-10 left-10 text-5xl opacity-15 -rotate-12">🎯</div>
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600">{user?.email}</p>
        </div>

        <Card className="p-8 mb-6 bg-white/80 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                {isPremium ? (
                  <>
                    <Crown className="text-lem-orange" size={28} />
                    Premium Plan
                  </>
                ) : (
                  <>
                    <Sparkles className="text-gray-400" size={28} />
                    Free Plan
                  </>
                )}
              </h2>
              {isPremium ? (
                <p className="text-gray-600">
                  Unlimited analyses • Participant testing • Priority support
                  {userRole?.subscription_end && (
                    <span className="block text-sm text-gray-500 mt-1">
                      Renews on {new Date(userRole.subscription_end).toLocaleDateString()}
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-gray-600">
                  {userRole?.analyses_limit - userRole?.analyses_used} of {userRole?.analyses_limit} analyses remaining
                </p>
              )}
            </div>
            {isPremium && (
              <div className="text-4xl">✨</div>
            )}
          </div>

          {!isPremium && (
            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Crown className="text-lem-orange" size={24} />
                Upgrade to Premium
              </h3>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 size={18} className="text-lem-orange flex-shrink-0" />
                  Unlimited emotion analyses
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 size={18} className="text-lem-orange flex-shrink-0" />
                  Participant testing with unlimited sessions
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 size={18} className="text-lem-orange flex-shrink-0" />
                  Advanced reporting and analytics
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 size={18} className="text-lem-orange flex-shrink-0" />
                  Priority email support
                </li>
              </ul>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-black text-gray-900">$9.99</span>
                <span className="text-gray-600">/month</span>
              </div>
              <Button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full bg-lem-orange hover:bg-lem-orange-dark"
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

        <Card className="p-6 bg-white/80 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Usage Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Analyses Used</span>
              <span className="font-bold text-gray-900">
                {isPremium ? '∞' : `${userRole?.analyses_used || 0} / ${userRole?.analyses_limit || 3}`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Account Type</span>
              <span className="font-bold text-gray-900">{isPremium ? 'Premium' : 'Free'}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
