import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, Zap, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EmotionToken from '@/components/EmotionToken';

interface LandingHeroProps {
  onAnalyze: (url: string) => void;
  isAnalyzing: boolean;
  user: { id: string; email: string; name?: string } | null;
}

const floatingEmotions = [
  { emotion: 'desire', delay: '0s', x: '8%', y: '20%' },
  { emotion: 'admiration', delay: '0.5s', x: '88%', y: '25%' },
  { emotion: 'joy', delay: '1s', x: '15%', y: '70%' },
  { emotion: 'surprise', delay: '1.5s', x: '85%', y: '65%' },
  { emotion: 'fascination', delay: '2s', x: '5%', y: '45%' },
  { emotion: 'satisfaction', delay: '2.5s', x: '92%', y: '45%' },
] as const;

const LandingHero = ({ onAnalyze, isAnalyzing, user }: LandingHeroProps) => {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAnalyze(url.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/30 relative overflow-hidden">
      {/* Floating emotion tokens background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingEmotions.map((item, index) => (
          <div
            key={index}
            className="absolute animate-float opacity-20"
            style={{
              left: item.x,
              top: item.y,
              animationDelay: item.delay,
              animationDuration: `${4 + index * 0.5}s`,
            }}
          >
            <EmotionToken emotion={item.emotion as any} size="lg" />
          </div>
        ))}
      </div>

      {/* Subtle gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

      {/* Header */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <img src="/lem-logo.svg" alt="LEM" className="w-8 h-8" />
          <span className="font-bold text-xl text-foreground">LEMTOOL</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <button 
            onClick={() => navigate('/about')} 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            About
          </button>
          <button 
            onClick={() => navigate('/pricing')} 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Pricing
          </button>
          <button 
            onClick={() => navigate('/support')} 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Support
          </button>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <Button onClick={() => navigate('/')} variant="outline" size="sm">
              Dashboard
            </Button>
          ) : (
            <Button onClick={() => navigate('/auth')} size="sm" className="bg-primary hover:bg-primary/90">
              Sign In
            </Button>
          )}
        </div>
      </header>

      {/* Hero Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-6 pb-20">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
            <Sparkles size={16} />
            <span>Scientifically Validated LEM Research</span>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-foreground tracking-tight leading-tight">
            Decode the emotions
            <br />
            <span className="text-primary">your website triggers</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-powered UX analysis that reveals how users emotionally experience your website. 
            Understand what works and what needs attention.
          </p>

          {/* URL Input Form */}
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mt-12">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
              <div className="relative bg-card rounded-xl shadow-2xl border border-border/50 p-2 flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Enter any website URL..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pl-12 h-14 text-lg border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isAnalyzing || !url.trim()}
                  size="lg"
                  className="h-14 px-8 text-lg font-semibold bg-primary hover:bg-primary/90 rounded-lg"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                </Button>
              </div>
            </div>
            
            {/* Example URLs */}
            <p className="mt-4 text-sm text-muted-foreground">
              Try: <span className="text-foreground/70">apple.com</span>, <span className="text-foreground/70">airbnb.com</span>, <span className="text-foreground/70">spotify.com</span>
            </p>
          </form>

          {/* Trust text */}
          <p className="text-sm text-muted-foreground mt-6">
            ✓ Free preview • No signup required
          </p>
        </div>

        {/* Trust indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-primary" />
            <span>AI-Powered</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-primary" />
            <span>500+ Websites Analyzed</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingHero;
