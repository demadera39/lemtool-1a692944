import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const [coupon, setCoupon] = useState('');

  const handlePurchasePack = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('purchase-analysis-pack', {
        body: coupon ? { coupon } : {}
      });
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success('Redirecting to checkout...');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Failed to start purchase process');
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
          <DialogTitle className="text-2xl text-center">Get More Analyses</DialogTitle>
          <DialogDescription className="text-center text-base">
            Buy analysis packs that never expire
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-accent">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">5 Analyses Pack</h4>
              <p className="text-xs text-muted-foreground">Perfect for occasional projects</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-accent">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Never Expire</h4>
              <p className="text-xs text-muted-foreground">Use at your own pace, no time pressure</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-accent">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">All Features Included</h4>
              <p className="text-xs text-muted-foreground">Full access to participant testing and reports</p>
            </div>
          </div>
        </div>

        <div className="bg-accent rounded-lg p-4 text-center">
          <div className="text-3xl font-black text-foreground mb-1">
            €4.99<span className="text-lg font-normal text-muted-foreground"></span>
          </div>
          <p className="text-xs text-muted-foreground">One-time payment • 5 analyses</p>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="coupon" className="text-sm font-medium text-muted-foreground block mb-2">
              Have a coupon code?
            </label>
            <Input
              id="coupon"
              placeholder="Enter coupon code"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              disabled={isLoading}
            />
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
              onClick={handlePurchasePack}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-[hsl(var(--lem-orange))] to-[hsl(var(--lem-orange-dark))] hover:opacity-90"
            >
              {isLoading ? 'Loading...' : 'Buy Pack'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
