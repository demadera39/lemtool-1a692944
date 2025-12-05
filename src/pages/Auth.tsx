import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { createProject, ensureProfile } from '@/services/supabaseService';
import { incrementAnalysisCount } from '@/services/userRoleService';
import { analyzeWebsite } from '@/services/geminiService';
import EmotionToken from '@/components/EmotionToken';
import { EmotionType } from '@/types';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // User is already logged in, redirect to home
        navigate('/', { replace: true });
      } else {
        setCheckingSession(false);
      }
    };
    
    checkSession();

    // Also listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        navigate('/', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handlePendingAnalysis = async (userId: string, userEmail: string, userName?: string) => {
    const pendingAnalysisStr = localStorage.getItem('pendingAnalysis');
    if (!pendingAnalysisStr) return false;

    try {
      const pendingAnalysis = JSON.parse(pendingAnalysisStr);
      localStorage.removeItem('pendingAnalysis');
      
      await ensureProfile(userId, userEmail, userName);
      
      toast.info('Saving your analysis...', { duration: 10000, id: 'pending-analysis' });
      const result = await analyzeWebsite(pendingAnalysis.url);
      
      await createProject(userId, pendingAnalysis.url, result.report, result.markers);
      await incrementAnalysisCount(userId);
      
      toast.dismiss('pending-analysis');
      toast.success('Your analysis has been saved to your dashboard!');
      return true;
    } catch (error) {
      console.error('Error saving pending analysis:', error);
      toast.dismiss('pending-analysis');
      toast.error('Failed to save analysis. Please try again.');
      return false;
    }
  };

  const handlePendingPurchase = async () => {
    const pendingPurchase = localStorage.getItem('pendingPurchase');
    if (!pendingPurchase) return;

    localStorage.removeItem('pendingPurchase');
    
    try {
      const functionName = pendingPurchase === 'starter' ? 'create-checkout' : 'purchase-analysis-pack';
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: pendingPurchase === 'pro' ? { pack_type: 'pro' } : {}
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
        navigate('/');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout. Please try again from the pricing page.');
      navigate('/pricing');
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/`
          }
        });

        if (error) {
          throw error;
        }
        
        if (signUpData?.session) {
          toast.success('Welcome! Your account has been created.');
          // Handle pending actions in background
          handlePendingAnalysis(signUpData.session.user.id, email, name);
          handlePendingPurchase();
          // Navigation is handled by onAuthStateChange
        } else if (signUpData?.user && !signUpData?.session) {
          toast.success('Account created! Please check your email to verify.');
          setMode('login');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          throw error;
        }
        
        if (data?.user) {
          toast.success('Welcome back!');
          // Handle pending actions in background
          handlePendingAnalysis(data.user.id, data.user.email!, data.user.user_metadata?.full_name);
          handlePendingPurchase();
          // Navigation is handled by onAuthStateChange
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      let message = 'Authentication failed';
      
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        message = 'Network error. Please check your connection and try again.';
      } else if (error.message === 'Invalid login credentials') {
        message = 'Invalid email or password.';
      } else if (error.message?.includes('already registered')) {
        message = 'This email is already registered. Please sign in instead.';
      } else if (error.message) {
        message = error.message;
      }
      
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking session
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/30 flex items-center justify-center">
        <div className="text-center">
          <img src="/lem-logo.svg" alt="LEM" className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/30 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating emotion tokens */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-[10%] opacity-10 animate-float-drift" style={{ animationDuration: '8s' }}>
          <EmotionToken emotion={EmotionType.JOY} size="lg" />
        </div>
        <div className="absolute top-[25%] right-[15%] opacity-10 animate-float-drift" style={{ animationDuration: '7s', animationDelay: '1s' }}>
          <EmotionToken emotion={EmotionType.FASCINATION} size="lg" />
        </div>
        <div className="absolute bottom-[20%] left-[15%] opacity-10 animate-float-drift" style={{ animationDuration: '6s', animationDelay: '2s' }}>
          <EmotionToken emotion={EmotionType.SATISFACTION} size="lg" />
        </div>
        <div className="absolute bottom-[30%] right-[10%] opacity-10 animate-float-drift" style={{ animationDuration: '9s', animationDelay: '0.5s' }}>
          <EmotionToken emotion={EmotionType.DESIRE} size="lg" />
        </div>
      </div>

      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-accent/20 rounded-full blur-3xl" />

      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-8 relative z-10 border border-border">
        <div className="text-center mb-8">
          <button onClick={() => navigate('/')} className="inline-block mb-4 hover:opacity-80 transition-opacity">
            <img src="/lem-logo.svg" alt="LEM" className="w-16 h-16 mx-auto" />
          </button>
          <h1 className="text-3xl font-black text-foreground mb-2">
            {mode === 'login' ? 'Welcome Back' : 'Join LEMTOOL'}
          </h1>
          <p className="text-muted-foreground">
            {mode === 'login' ? 'Sign in to your account' : 'Create your free account'}
          </p>
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <Label htmlFor="name" className="text-foreground">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="mt-1.5"
              />
            </div>
          )}

          <div>
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-foreground">Password</Label>
            <div className="relative mt-1.5">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-primary font-bold hover:underline"
            disabled={isLoading}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </div>

        {mode === 'signup' && (
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-3">
              <Sparkles size={16} className="text-primary" />
              <span>Start with 3 free analyses</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              By signing up, you agree to our{' '}
              <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;