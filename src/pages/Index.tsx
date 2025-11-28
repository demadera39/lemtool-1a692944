import { useState } from 'react';
import AnalysisCanvas from '@/components/AnalysisCanvas';
import ReportPanel from '@/components/ReportPanel';
import Toolbar from '@/components/Toolbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Marker, AnalysisReport, EmotionType, LayerType } from '@/types';
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
  const [activeLayer, setActiveLayer] = useState<LayerType>('emotions');

  const analyzeWebsite = async (targetUrl: string): Promise<{ markers: Marker[]; report: AnalysisReport }> => {
    // For now, using simulated analysis - will be replaced with real Gemini API call
    await new Promise(resolve => setTimeout(resolve, 3000));

    const emotions: EmotionType[] = [
      EmotionType.JOY,
      EmotionType.DESIRE,
      EmotionType.FASCINATION,
      EmotionType.SATISFACTION,
      EmotionType.SADNESS,
      EmotionType.DISGUST
    ];
    
    const generatedMarkers: Marker[] = Array.from({ length: 6 }, (_, i) => ({
      id: `marker-${i}`,
      x: 20 + Math.random() * 60,
      y: 15 + Math.random() * 70,
      layer: 'emotions' as LayerType,
      emotion: emotions[Math.floor(Math.random() * emotions.length)],
      comment: 'AI-detected emotional trigger point',
      source: 'AI' as const,
    }));

    const generatedReport: AnalysisReport = {
      overallScore: 65 + Math.floor(Math.random() * 25),
      summary: 'This website demonstrates strong emotional engagement through well-placed visual elements and clear messaging. The design effectively balances user needs with business goals.',
      targetAudience: 'Tech-savvy professionals aged 25-45 seeking innovative solutions',
      audienceSplit: [
        { label: 'Early Adopters', percentage: 45 },
        { label: 'Pragmatists', percentage: 35 },
        { label: 'Conservative Users', percentage: 20 }
      ],
      personas: [
        {
          name: 'Sarah Chen',
          role: 'Product Manager',
          bio: 'Results-driven PM at a mid-sized tech company',
          goals: 'Find efficient tools to streamline team workflows',
          quote: 'I need solutions that just work without a steep learning curve',
          techLiteracy: 'High',
          psychographics: 'Values efficiency, innovation, and collaboration',
          values: ['Efficiency', 'Innovation', 'Team Success'],
          frustrations: ['Complex interfaces', 'Poor documentation', 'Slow support']
        }
      ],
      brandValues: ['Innovation', 'Reliability', 'User-First Design'],
      keyFindings: [
        {
          title: 'Strong Visual Hierarchy',
          description: 'The layout effectively guides users through key information',
          type: 'positive'
        },
        {
          title: 'Clear Call-to-Actions',
          description: 'Primary actions are prominently displayed and easy to find',
          type: 'positive'
        },
        {
          title: 'Navigation Complexity',
          description: 'Some users may find the menu structure overwhelming',
          type: 'negative'
        }
      ],
      suggestions: [
        'Enhance trust signals near CTAs',
        'Add social proof elements',
        'Optimize color contrast for accessibility',
        'Strengthen emotional connection in copy'
      ],
      layoutStructure: [
        { type: 'hero', estimatedHeight: 600, backgroundColorHint: 'light' },
        { type: 'features', estimatedHeight: 800, backgroundColorHint: 'light' },
        { type: 'testimonials', estimatedHeight: 400, backgroundColorHint: 'light' }
      ],
      sdtScores: {
        autonomy: { score: 7, justification: 'Users have control over their experience with clear choices' },
        competence: { score: 8, justification: 'Interface provides immediate feedback and guidance' },
        relatedness: { score: 6, justification: 'Social elements present but could be more prominent' }
      },
      creativeBrief: {
        problemStatement: 'Users struggle to find the information they need quickly',
        targetEmotion: 'Confidence and Trust',
        howMightWe: 'How might we simplify navigation while maintaining comprehensive content?',
        strategicDirection: 'Focus on progressive disclosure and contextual help'
      }
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
    setActiveLayer('emotions');

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

  const handleAddMarker = (emotion: EmotionType) => {
    if (!hasStarted || activeLayer !== 'emotions') return;
    const newMarker: Marker = {
      id: Math.random().toString(36).substr(2, 9),
      x: 50,
      y: 20,
      layer: 'emotions',
      emotion,
      source: 'AI',
      comment: 'Manually added emotion marker'
    };
    setMarkers(prev => [...prev, newMarker]);
  };

  return (
    <div className="flex h-screen w-screen bg-gray-50 text-gray-900 overflow-hidden">
      <Toolbar onAddMarker={handleAddMarker} />

      <div className="flex-1 flex flex-col h-full relative">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shadow-sm z-10 justify-between flex-shrink-0">
          <div className="w-32 flex justify-start">
            <button className="text-xs font-medium text-gray-500 hover:text-lem-orange flex items-center gap-1 transition-colors">
              <Info size={14} />
              About LEMtool
            </button>
          </div>

          <form onSubmit={handleAnalyze} className="flex-1 max-w-2xl mx-auto flex items-center gap-2">
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400 group-focus-within:text-lem-orange" />
              </div>
              <Input
                type="text"
                placeholder="Enter website URL (e.g., www.metodic.io)"
                className="pl-10"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoComplete="off"
              />
            </div>
            <Button
              type="submit"
              disabled={isAnalyzing || !url}
              className="bg-lem-orange hover:bg-lem-orange-dark"
            >
              {isAnalyzing ? 'Thinking...' : 'Analyze'}
            </Button>
          </form>

          <div className="w-32 flex justify-end">
            <button className="text-xs font-bold text-gray-400 hover:text-lem-orange flex items-center gap-1">
              Login
            </button>
          </div>
        </header>

        {showInfoBanner && (
          <div className="bg-orange-50 border-b border-orange-200 text-orange-900 text-xs px-6 py-2 flex items-center justify-between z-[5]">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-lem-orange" />
              <span>
                <strong>Note:</strong> Some websites have security that blocks live previews. Don't worry, the analysis still works perfectly!
              </span>
            </div>
            <button onClick={() => setShowInfoBanner(false)} className="hover:bg-orange-100 p-1 rounded-full">
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 bg-gray-100 relative flex flex-col overflow-hidden">
            {!hasStarted ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto text-gray-500">
                <div className="w-24 h-24 bg-gray-200 rounded-full mb-6 flex items-center justify-center text-4xl grayscale opacity-50 border-4 border-gray-200">
                  😑
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Ready to Measure Emotion?</h2>
                <p className="mb-6">Enter a URL above. The live website will load, and AI will overlay emotional markers.</p>
              </div>
            ) : (
              <div className="w-full h-full relative p-6">
                <AnalysisCanvas
                  imgUrl={validUrl}
                  markers={markers}
                  setMarkers={setMarkers}
                  isAnalyzing={isAnalyzing}
                  activeLayer={activeLayer}
                  setActiveLayer={setActiveLayer}
                  screenshot={report?.screenshot}
                />
              </div>
            )}
          </div>

          <div className="w-96 h-full shadow-xl z-20 bg-white border-l border-gray-200 flex-shrink-0">
            <ReportPanel
              report={report}
              markers={markers}
              isAnalyzing={isAnalyzing}
              currentUrl={validUrl}
              activeLayer={activeLayer}
              setActiveLayer={setActiveLayer}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
