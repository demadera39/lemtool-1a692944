import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import EmotionToken from '@/components/EmotionToken';
import { EmotionType } from '@/types';

const Pricing = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async (type: 'starter' | 'pro' | 'topup') => {
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        localStorage.setItem('pendingPurchase', type);
        navigate('/auth');
        return;
      }

      await initiateCheckout(type);
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Failed to start purchase');
    } finally {
      setIsLoading(false);
    }
  };

  const initiateCheckout = async (type: 'starter' | 'pro' | 'topup') => {
    try {
      const functionName = type === 'starter' ? 'create-checkout' : 'purchase-analysis-pack';
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: type === 'pro' ? { pack_type: 'pro' } : {}
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/30 relative overflow-hidden">
      {/* Floating emotions background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-[10%] opacity-10 animate-float-drift" style={{ animationDuration: '7s' }}>
          <EmotionToken emotion={EmotionType.JOY} size="lg" />
        </div>
        <div className="absolute bottom-32 left-[8%] opacity-10 animate-float-drift" style={{ animationDelay: '2s', animationDuration: '8s' }}>
          <EmotionToken emotion={EmotionType.SATISFACTION} size="lg" />
        </div>
        <div className="absolute top-1/3 left-[5%] opacity-10 animate-float-drift" style={{ animationDelay: '1s', animationDuration: '6s' }}>
          <EmotionToken emotion={EmotionType.FASCINATION} size="lg" />
        </div>
      </div>
      
      <Header />

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl font-black text-foreground mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground">
            Choose a monthly plan or buy one-time packs that never expire
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {/* Free Tier */}
          <div className="bg-card rounded-2xl border-2 border-border p-8 shadow-lg animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-foreground mb-2">Free</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-foreground">€0</span>
              </div>
              <p className="text-muted-foreground text-sm mt-1">One-time only</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-foreground/80"><strong>3 analyses</strong> to try</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-foreground/80">AI emotion markers</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-foreground/80">Full analysis reports</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">No participant testing</span>
              </li>
            </ul>

            <Button onClick={() => navigate('/auth')} variant="outline" className="w-full" disabled={isLoading}>
              Get Started Free
            </Button>
          </div>

          {/* Starter Pack */}
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl border-2 border-primary p-8 shadow-2xl relative animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-card px-4 py-1 rounded-full text-sm font-bold text-primary border-2 border-primary">
              Most Popular
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-black text-primary-foreground mb-2">Starter</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-primary-foreground">€9.99</span>
                <span className="text-primary-foreground/70 text-lg">/month</span>
              </div>
              <p className="text-primary-foreground/70 text-sm mt-1">Best value • €1.00/analysis</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check size={20} className="text-primary-foreground flex-shrink-0 mt-0.5" />
                <span className="text-primary-foreground font-medium"><strong>10 analyses/month</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-primary-foreground flex-shrink-0 mt-0.5" />
                <span className="text-primary-foreground font-medium">AI emotion markers</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-primary-foreground flex-shrink-0 mt-0.5" />
                <span className="text-primary-foreground font-medium">Full analysis reports</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-primary-foreground flex-shrink-0 mt-0.5" />
                <span className="text-primary-foreground font-medium">Participant testing</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-primary-foreground flex-shrink-0 mt-0.5" />
                <span className="text-primary-foreground font-medium">20% off Pro Packs</span>
              </li>
            </ul>

            <Button 
              onClick={() => handlePurchase('starter')} 
              className="w-full bg-card text-primary hover:bg-card/90"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Start Subscription'}
            </Button>
          </div>

          {/* Pro Pack */}
          <div className="bg-card rounded-2xl border-2 border-primary/50 p-8 shadow-lg animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-foreground mb-2">Pro Pack</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-foreground">€24.99</span>
              </div>
              <p className="text-muted-foreground text-sm mt-1">20 analyses • Never expire</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-foreground/80"><strong>20 analyses</strong> one-time</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-foreground/80">Great for bulk projects</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-foreground/80">All premium features</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-foreground/80">No recurring charges</span>
              </li>
            </ul>

            <Button 
              onClick={() => handlePurchase('pro')} 
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Buy Pro Pack'}
            </Button>
          </div>

          {/* Top-up Pack */}
          <div className="bg-card rounded-2xl border-2 border-border p-8 shadow-lg animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-foreground mb-2">Top-up</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-foreground">€4.99</span>
              </div>
              <p className="text-muted-foreground text-sm mt-1">5 analyses • Never expire</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-foreground/80"><strong>5 analyses</strong> one-time</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-foreground/80">Perfect for occasional use</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-foreground/80">All premium features</span>
              </li>
              <li className="flex items-start gap-3">
                <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-foreground/80">Stack with other packs</span>
              </li>
            </ul>

            <Button 
              onClick={() => handlePurchase('topup')} 
              variant="outline" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Buy Top-up Pack'}
            </Button>
          </div>
        </div>

        <div className="mt-16 text-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <h3 className="text-2xl font-black text-foreground mb-8">
            Frequently Asked Questions
          </h3>
          <div className="max-w-2xl mx-auto space-y-6 text-left">
            <div className="bg-card rounded-lg p-6 border border-border">
              <h4 className="font-bold text-foreground mb-2">
                What's the difference between Starter and packs?
              </h4>
              <p className="text-muted-foreground">
                Starter is a monthly subscription (€9.99/month for 10 analyses, best value at €1.00 each). Pro Pack and Top-up packs are one-time purchases that never expire—buy once, use anytime.
              </p>
            </div>
            <div className="bg-card rounded-lg p-6 border border-border">
              <h4 className="font-bold text-foreground mb-2">
                Can I buy multiple packs?
              </h4>
              <p className="text-muted-foreground">
                Yes! All one-time packs (Pro Pack and Top-up) stack together and never expire. Use them at your own pace.
              </p>
            </div>
            <div className="bg-card rounded-lg p-6 border border-border">
              <h4 className="font-bold text-foreground mb-2">
                How does participant testing work?
              </h4>
              <p className="text-muted-foreground">
                Premium users can generate invite links for participants to place emotion markers and provide feedback on your UI, which you can then compare with AI insights.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
