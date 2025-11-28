import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Zap, Shield, TrendingUp } from 'lucide-react';
import { supabase } from '@/services/supabaseService';
import { toast } from 'sonner';
import { useState } from 'react';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UpgradeModal = ({ open, onOpenChange }: UpgradeModalProps) => {
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
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(var(--lem-orange))] to-[hsl(var(--lem-orange-dark))] flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-2xl text-center">Upgrade to Premium</DialogTitle>
          <DialogDescription className="text-center text-base">
            Unlock unlimited analyses and advanced features
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-accent">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Unlimited Analyses</h4>
              <p className="text-xs text-muted-foreground">Run as many analyses as you need, no monthly limits</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-accent">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Priority Processing</h4>
              <p className="text-xs text-muted-foreground">Get faster analysis with priority queue access</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-accent">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Advanced Features</h4>
              <p className="text-xs text-muted-foreground">Access to all premium tools and upcoming features</p>
            </div>
          </div>
        </div>

        <div className="bg-accent rounded-lg p-4 text-center">
          <div className="text-3xl font-black text-foreground mb-1">
            €9.99<span className="text-lg font-normal text-muted-foreground">/month</span>
          </div>
          <p className="text-xs text-muted-foreground">Cancel anytime, no commitments</p>
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
            {isLoading ? 'Loading...' : 'Upgrade Now'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
