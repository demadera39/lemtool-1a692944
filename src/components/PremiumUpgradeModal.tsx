import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Zap, Shield, TrendingUp, Crown } from 'lucide-react';
import { supabase } from '@/services/supabaseService';
import { toast } from 'sonner';
import { useState } from 'react';

interface PremiumUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PremiumUpgradeModal = ({ open, onOpenChange }: PremiumUpgradeModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success('Redirecting to checkout...');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error('Failed to start upgrade process');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(var(--lem-orange))] to-[hsl(var(--lem-orange-dark))] flex items-center justify-center p-1">
            <img 
              src="https://zuuapuzwnghgdkskkvhc.supabase.co/storage/v1/object/public/LEMemotions/desire.png" 
              alt="Desire" 
              className="w-full h-full"
            />
          </div>
          <DialogTitle className="text-2xl text-center">Upgrade to Premium</DialogTitle>
          <DialogDescription className="text-center text-base">
            Get 10 monthly analyses + all premium features
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-accent">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">10 Monthly Analyses</h4>
              <p className="text-xs text-muted-foreground">Consistent monthly quota for regular use</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-accent">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Participant Testing</h4>
              <p className="text-xs text-muted-foreground">Get real user feedback with testing links</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-accent">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">AI vs Human Comparison</h4>
              <p className="text-xs text-muted-foreground">Compare AI insights with real participant data</p>
            </div>
          </div>
        </div>

        <div className="bg-accent rounded-lg p-4 text-center">
          <div className="text-3xl font-black text-foreground mb-1">
            €9.99<span className="text-lg font-normal text-muted-foreground">/month</span>
          </div>
          <p className="text-xs text-muted-foreground">Cancel anytime • 10 analyses per month</p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={isLoading}
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-[hsl(var(--lem-orange))] to-[hsl(var(--lem-orange-dark))] hover:opacity-90"
          >
            {isLoading ? 'Loading...' : 'Upgrade to Premium'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
