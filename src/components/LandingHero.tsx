import { useState } from 'react';
import { Search, Sparkles, Zap, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EmotionToken from '@/components/EmotionToken';
import Header from '@/components/Header';
import { EmotionType } from '@/types';

interface LandingHeroProps {
  onAnalyze: (url: string) => void;
  isAnalyzing: boolean;
}

// More floating emotions with varied positions and timing
const floatingEmotions = [
  { emotion: EmotionType.DESIRE, x: '5%', y: '15%', size: 'lg', duration: 6, delay: 0 },
  { emotion: EmotionType.JOY, x: '92%', y: '20%', size: 'md', duration: 7, delay: 1 },
  { emotion: EmotionType.JOY, x: '10%', y: '75%', size: 'lg', duration: 5, delay: 0.5 },
  { emotion: EmotionType.FASCINATION, x: '88%', y: '70%', size: 'md', duration: 6.5, delay: 2 },
  { emotion: EmotionType.FASCINATION, x: '3%', y: '45%', size: 'md', duration: 5.5, delay: 1.5 },
  { emotion: EmotionType.SATISFACTION, x: '95%', y: '45%', size: 'lg', duration: 7, delay: 0.8 },
  { emotion: EmotionType.DESIRE, x: '15%', y: '30%', size: 'sm', duration: 8, delay: 3 },
  { emotion: EmotionType.JOY, x: '85%', y: '35%', size: 'sm', duration: 6, delay: 2.5 },
  { emotion: EmotionType.SATISFACTION, x: '8%', y: '60%', size: 'sm', duration: 7.5, delay: 1.2 },
  { emotion: EmotionType.FASCINATION, x: '90%', y: '55%', size: 'sm', duration: 5.8, delay: 0.3 },
  { emotion: EmotionType.DESIRE, x: '20%', y: '85%', size: 'md', duration: 6.2, delay: 2.8 },
  { emotion: EmotionType.SATISFACTION, x: '80%', y: '82%', size: 'sm', duration: 7.2, delay: 1.8 },
];

const LandingHero = ({ onAnalyze, isAnalyzing }: LandingHeroProps) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAnalyze(url.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/30 relative overflow-hidden">
      {/* Example analysis preview - faded background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[700px] opacity-[0.15]">
          <div className="relative w-full h-full rounded-2xl overflow-hidden">
            {/* Mock website preview */}
            <div className="absolute inset-0 bg-gradient-to-b from-card to-muted rounded-2xl">
              {/* Mock header */}
              <div className="h-12 bg-card/80 border-b border-border/30 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive/40" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/40" />
                <div className="w-3 h-3 rounded-full bg-green-500/40" />
                <div className="flex-1 mx-8 h-6 bg-muted/50 rounded-full" />
              </div>
              {/* Mock content blocks */}
              <div className="p-8 space-y-6">
                <div className="h-8 w-3/4 bg-muted/30 rounded" />
                <div className="h-4 w-1/2 bg-muted/20 rounded" />
                <div className="grid grid-cols-3 gap-4 mt-8">
                  <div className="h-32 bg-muted/25 rounded-lg" />
                  <div className="h-32 bg-muted/25 rounded-lg" />
                  <div className="h-32 bg-muted/25 rounded-lg" />
                </div>
                <div className="space-y-3 mt-8">
                  <div className="h-3 w-full bg-muted/15 rounded" />
                  <div className="h-3 w-5/6 bg-muted/15 rounded" />
                  <div className="h-3 w-4/6 bg-muted/15 rounded" />
                </div>
              </div>

              {/* Emotion markers with speech bubbles - scaled up */}
              <div className="absolute top-16 left-[10%] animate-float-drift" style={{ animationDelay: '0s', animationDuration: '8s' }}>
                <div className="relative scale-125">
                  <EmotionToken emotion={EmotionType.JOY} size="md" />
                  <div className="absolute -top-10 left-8 bg-white rounded-lg px-3 py-2 text-xs text-foreground whitespace-nowrap shadow-lg border border-border/50">
                    Clear value proposition ✓
                  </div>
                </div>
              </div>
              <div className="absolute top-24 right-[15%] animate-float-drift" style={{ animationDelay: '1.5s', animationDuration: '7s' }}>
                <div className="relative scale-125">
                  <EmotionToken emotion={EmotionType.FASCINATION} size="md" />
                  <div className="absolute -top-10 -left-16 bg-white rounded-lg px-3 py-2 text-xs text-foreground whitespace-nowrap shadow-lg border border-border/50">
                    Engaging visuals
                  </div>
                </div>
              </div>
              <div className="absolute top-56 left-[25%] animate-float-drift" style={{ animationDelay: '0.8s', animationDuration: '9s' }}>
                <div className="relative scale-125">
                  <EmotionToken emotion={EmotionType.DESIRE} size="md" />
                  <div className="absolute -top-10 left-8 bg-white rounded-lg px-3 py-2 text-xs text-foreground whitespace-nowrap shadow-lg border border-border/50">
                    Strong CTA detected
                  </div>
                </div>
              </div>

              {/* Needs markers (diamond shape) - larger and more visible */}
              <div className="absolute top-40 right-[28%] animate-float-drift" style={{ animationDelay: '2s', animationDuration: '7.5s' }}>
                <div className="relative">
                  <div className="w-7 h-7 bg-blue-500 rotate-45 rounded-sm shadow-lg ring-2 ring-blue-300" />
                  <div className="absolute -top-10 -left-12 bg-white rounded-lg px-3 py-2 text-xs text-foreground whitespace-nowrap shadow-lg border border-border/50">
                    <span className="text-blue-600 font-bold">Autonomy:</span> User control
                  </div>
                </div>
              </div>
              <div className="absolute bottom-32 left-[18%] animate-float-drift" style={{ animationDelay: '1s', animationDuration: '8.5s' }}>
                <div className="relative">
                  <div className="w-7 h-7 bg-emerald-500 rotate-45 rounded-sm shadow-lg ring-2 ring-emerald-300" />
                  <div className="absolute -top-10 left-8 bg-white rounded-lg px-3 py-2 text-xs text-foreground whitespace-nowrap shadow-lg border border-border/50">
                    <span className="text-emerald-600 font-bold">Competence:</span> Easy navigation
                  </div>
                </div>
              </div>
              <div className="absolute bottom-44 right-[22%] animate-float-drift" style={{ animationDelay: '2.5s', animationDuration: '7s' }}>
                <div className="relative">
                  <div className="w-7 h-7 bg-violet-500 rotate-45 rounded-sm shadow-lg ring-2 ring-violet-300" />
                  <div className="absolute -top-10 -left-14 bg-white rounded-lg px-3 py-2 text-xs text-foreground whitespace-nowrap shadow-lg border border-border/50">
                    <span className="text-violet-600 font-bold">Relatedness:</span> Social proof
                  </div>
                </div>
              </div>

              {/* Strategy markers (star shape) - larger */}
              <div className="absolute top-32 left-[45%] animate-float-drift" style={{ animationDelay: '0.5s', animationDuration: '9s' }}>
                <div className="relative">
                  <div className="text-amber-500 text-2xl drop-shadow-md">★</div>
                  <div className="absolute -top-10 left-6 bg-white rounded-lg px-3 py-2 text-xs text-foreground whitespace-nowrap shadow-lg border border-border/50">
                    <span className="text-amber-600 font-bold">Opportunity:</span> Add testimonials
                  </div>
                </div>
              </div>
              <div className="absolute bottom-24 left-[42%] animate-float-drift" style={{ animationDelay: '1.8s', animationDuration: '8s' }}>
                <div className="relative">
                  <div className="text-rose-500 text-2xl drop-shadow-md">★</div>
                  <div className="absolute -top-10 -left-8 bg-white rounded-lg px-3 py-2 text-xs text-foreground whitespace-nowrap shadow-lg border border-border/50">
                    <span className="text-rose-600 font-bold">Pain Point:</span> Slow load time
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating emotion tokens with varied animations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingEmotions.map((item, index) => (
          <div
            key={index}
            className="absolute animate-float-drift"
            style={{
              left: item.x,
              top: item.y,
              animationDelay: `${item.delay}s`,
              animationDuration: `${item.duration}s`,
              opacity: item.size === 'lg' ? 0.15 : item.size === 'md' ? 0.12 : 0.08,
            }}
          >
            <div className={`transform ${item.size === 'lg' ? 'scale-125' : item.size === 'sm' ? 'scale-75' : ''}`}>
              <EmotionToken emotion={item.emotion} size="lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/8 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }} />

      <Header variant="transparent" />

      {/* Hero Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-6 pb-20">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary animate-fade-in">
            <Sparkles size={16} />
            <span>Scientifically Validated LEM Research</span>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-foreground tracking-tight leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Decode the emotions
            <br />
            <span className="text-primary">your website triggers</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            AI-powered UX analysis that reveals how users emotionally experience your website. 
            Understand what works and what needs attention.
          </p>

          {/* URL Input Form */}
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mt-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
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
                  className="h-14 px-8 text-lg font-semibold bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] rounded-lg transition-all duration-200"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                </Button>
              </div>
            </div>
            
            {/* Example URLs */}
            <p className="mt-4 text-sm text-muted-foreground">
              Try: <span className="text-foreground/70 hover:text-primary cursor-pointer transition-colors" onClick={() => setUrl('apple.com')}>apple.com</span>, <span className="text-foreground/70 hover:text-primary cursor-pointer transition-colors" onClick={() => setUrl('airbnb.com')}>airbnb.com</span>, <span className="text-foreground/70 hover:text-primary cursor-pointer transition-colors" onClick={() => setUrl('spotify.com')}>spotify.com</span>
            </p>
          </form>

          {/* Trust text */}
          <p className="text-sm text-muted-foreground mt-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            ✓ Free preview • No signup required
          </p>
        </div>

        {/* Trust indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-8 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.5s' }}>
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
