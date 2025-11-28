import { useState } from 'react';
import { AnalysisCanvas } from '@/components/AnalysisCanvas';
import { ReportPanel } from '@/components/ReportPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Marker, AnalysisReport, EmotionType } from '@/types/lemtool';
import { Search, Info, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const [url, setUrl] = useState('');
  const [validUrl, setValidUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [showInfoBanner, setShowInfoBanner] = useState(true);

  const analyzeWebsite = async (targetUrl: string): Promise<{ markers: Marker[]; report: AnalysisReport }> => {
    // Simulate AI analysis - In production, this would call Lovable AI
    await new Promise(resolve => setTimeout(resolve, 3000));

    const emotions: EmotionType[] = ['joy', 'trust', 'fear', 'surprise', 'sadness', 'disgust', 'anger', 'anticipation'];
    
    // Generate random markers
    const generatedMarkers: Marker[] = Array.from({ length: 6 }, (_, i) => ({
      id: `marker-${i}`,
      x: 20 + Math.random() * 60,
      y: 15 + Math.random() * 70,
      emotion: emotions[Math.floor(Math.random() * emotions.length)],
      comment: 'AI-detected emotional trigger point',
      timestamp: Date.now(),
    }));

    // Generate emotion distribution
    const emotionDist: Record<EmotionType, number> = {
      joy: Math.floor(Math.random() * 30),
      trust: Math.floor(Math.random() * 25),
      fear: Math.floor(Math.random() * 15),
      surprise: Math.floor(Math.random() * 10),
      sadness: Math.floor(Math.random() * 10),
      disgust: Math.floor(Math.random() * 5),
      anger: Math.floor(Math.random() * 5),
      anticipation: Math.floor(Math.random() * 20),
    };

    const generatedReport: AnalysisReport = {
      url: targetUrl,
      overallScore: 65 + Math.floor(Math.random() * 25),
      emotions: emotionDist,
      insights: [
        'Strong positive emotional triggers in hero section',
        'Call-to-action buttons evoke trust and anticipation',
        'Color scheme promotes feelings of joy and confidence',
        'Navigation design reduces cognitive friction',
      ],
      recommendations: [
        'Enhance trust signals near CTAs',
        'Add social proof elements',
        'Optimize color contrast for accessibility',
        'Strengthen emotional connection in copy',
      ],
      timestamp: Date.now(),
    };

    return { markers: generatedMarkers, report: generatedReport };
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    let targetUrl = url.trim();
    
    if (!targetUrl) {
      toast.error('Please enter a URL');
      return;
    }
    
    if (!targetUrl.match(/^https?:\/\//i)) {
      targetUrl = 'https://' + targetUrl;
    }
    
    setUrl(targetUrl);
    setValidUrl(targetUrl);
    setHasStarted(true);
    setIsAnalyzing(true);
    setMarkers([]);
    setReport(null);

    try {
      const result = await analyzeWebsite(targetUrl);
      setMarkers(result.markers);
      setReport(result.report);
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRemoveMarker = (id: string) => {
    setMarkers(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden">
      <div className="flex-1 flex flex-col h-full">
        <header className="h-16 bg-card border-b border-border flex items-center px-6 shadow-sm z-10 justify-between flex-shrink-0">
          <div className="w-32 flex justify-start">
            <button className="text-xs font-medium text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
              <Info size={14} />
              About LEMtool
            </button>
          </div>

          <form onSubmit={handleAnalyze} className="flex-1 max-w-2xl mx-auto flex items-center gap-2">
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-muted-foreground group-focus-within:text-primary" />
              </div>
              <Input
                type="text"
                placeholder="Enter website URL (e.g., www.example.com)"
                className="pl-10"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoComplete="off"
              />
            </div>
            <Button
              type="submit"
              disabled={isAnalyzing || !url}
              className="bg-primary hover:bg-primary/90"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </Button>
          </form>

          <div className="w-32 flex justify-end">
            <button className="text-xs font-medium text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
              Login
            </button>
          </div>
        </header>

        {showInfoBanner && (
          <div className="bg-accent border-b border-border text-accent-foreground text-xs px-6 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-primary" />
              <span>
                <strong>Note:</strong> Some websites have security that blocks live previews. The analysis still works perfectly!
              </span>
            </div>
            <button onClick={() => setShowInfoBanner(false)} className="hover:bg-accent/80 p-1 rounded-full">
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 bg-muted/30 relative flex flex-col overflow-hidden p-6">
            {!hasStarted ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto">
                <div className="w-24 h-24 bg-muted rounded-full mb-6 flex items-center justify-center text-4xl border-4 border-border">
                  😑
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Ready to Measure Emotion?</h2>
                <p className="text-muted-foreground mb-6">
                  Enter a URL above. The website will load, and AI will overlay emotional markers showing how users feel.
                </p>
              </div>
            ) : (
              <AnalysisCanvas
                url={validUrl}
                markers={markers}
                onRemoveMarker={handleRemoveMarker}
                isAnalyzing={isAnalyzing}
              />
            )}
          </div>

          <div className="w-96 h-full shadow-xl bg-card border-l border-border flex-shrink-0 overflow-hidden">
            <ReportPanel report={report} isAnalyzing={isAnalyzing} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
