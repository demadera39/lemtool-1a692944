import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Toolbar from '@/components/Toolbar';
import AnalysisCanvas from '@/components/AnalysisCanvas';
import ReportPanel from '@/components/ReportPanel';
import Dashboard from '@/components/Dashboard';
import ParticipantView from '@/components/ParticipantView';
import AboutModal from '@/components/AboutModal';
import { Marker, EmotionType, User, LayerType, Project } from '@/types';
import { analyzeWebsite } from '@/services/geminiService';
import { supabase, signOut, createProject, getProjectById } from '@/services/supabaseService';
import { getUserRole, canCreateAnalysis, incrementAnalysisCount, getRemainingAnalyses } from '@/services/userRoleService';
import { Search, Info, AlertCircle, X, Save, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'participant'>('landing');
  const [testProject, setTestProject] = useState<Project | null>(null);
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [report, setReport] = useState<any>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [validUrl, setValidUrl] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [activeLayer, setActiveLayer] = useState<LayerType>('emotions');
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const [remainingAnalyses, setRemainingAnalyses] = useState<number>(-1);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const newUser = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.full_name || session.user.user_metadata.name,
          isAdmin: false
        };
        setUser(newUser);
        loadUserRole(session.user.id);
      } else {
        setUser(null);
        setRemainingAnalyses(-1);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const newUser = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.full_name || session.user.user_metadata.name,
          isAdmin: false
        };
        setUser(newUser);
        loadUserRole(session.user.id);
      }
    });

    const params = new URLSearchParams(window.location.search);
    const testId = params.get('test');
    if (testId) {
      getProjectById(testId).then(p => {
        if (p) {
          setTestProject(p);
          setCurrentView('participant');
        }
      });
    }

    return () => subscription.unsubscribe();
  }, []);

  const loadUserRole = async (userId: string) => {
    const remaining = await getRemainingAnalyses(userId);
    setRemainingAnalyses(remaining);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    let targetUrl = url.trim();
    if (!targetUrl) return;
    if (!targetUrl.match(/^https?:\/\//i)) targetUrl = 'https://' + targetUrl;
    
    // Check if user is logged in
    if (!user) {
      // Anonymous preview mode - limited to 4 markers per category
      setUrl(targetUrl);
      setValidUrl(targetUrl);
      setHasStarted(true);
      setIsAnalyzing(true);
      setMarkers([]);
      setReport(null);
      setActiveLayer('emotions');

      try {
        const result = await analyzeWebsite(targetUrl);
        // Limit markers for anonymous users
        const limitedMarkers = result.markers.slice(0, 4);
        setMarkers(limitedMarkers);
        // Create preview report with limited data
        setReport({ ...result.report, isPreview: true });
        toast.info('Preview mode - Sign up for full analysis!');
      } catch (error) {
        console.error("Analysis Error:", error);
        toast.error('Analysis failed.');
      } finally {
        setIsAnalyzing(false);
      }
      return;
    }

    // Check if user can create analysis
    const canCreate = await canCreateAnalysis(user.id);
    if (!canCreate) {
      toast.error('You have reached your analysis limit. Upgrade to premium!');
      return;
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
      await incrementAnalysisCount(user.id);
      await loadUserRole(user.id);
      toast.success('Analysis complete!');
    } catch (error) {
      console.error("Analysis Error:", error);
      toast.error('Analysis failed.');
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
      comment: 'Manually added.'
    };
    setMarkers(prev => [...prev, newMarker]);
  };

  const handleSaveProject = async () => {
    if (!user || !report) return;
    try {
      await createProject(user.id, validUrl, report, markers);
      toast.success('Project saved!');
      setCurrentView('dashboard');
    } catch (error) {
      toast.error('Failed to save project');
    }
  };

  if (currentView === 'participant' && testProject) {
    return <ParticipantView project={testProject} onExit={() => { setTestProject(null); setCurrentView('landing'); }} />;
  }

  if (currentView === 'dashboard' && user) {
    return (
      <Dashboard
        user={user}
        onLogout={async () => { await signOut(); setUser(null); setCurrentView('landing'); }}
        onNavigateToAnalysis={() => {}}
        onNavigateToTest={(p) => { setTestProject(p); setCurrentView('participant'); }}
        onNewAnalysis={() => setCurrentView('landing')}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen bg-gray-50 text-gray-900 overflow-hidden">
      <AboutModal isOpen={showAboutModal} onClose={() => setShowAboutModal(false)} />
      <Toolbar onAddMarker={handleAddMarker} />

      <div className="flex-1 flex flex-col h-full relative">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shadow-sm z-10 justify-between flex-shrink-0">
          <div className="w-32 flex justify-start">
            <button onClick={() => setShowAboutModal(true)} className="text-xs font-medium text-gray-500 hover:text-lem-orange flex items-center gap-1 transition-colors">
              <Info size={14} />About LEMtool
            </button>
          </div>

          <form onSubmit={handleAnalyze} className="flex-1 max-w-2xl mx-auto flex items-center gap-2">
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400 group-focus-within:text-lem-orange" />
              </div>
              <Input type="text" placeholder="Enter website URL (e.g., www.metodic.io)" className="pl-10" value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
            <Button type="submit" disabled={isAnalyzing || !url} className="bg-lem-orange hover:bg-lem-orange-dark">
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </Button>
          </form>

          <div className="w-32 flex justify-end gap-2">
            {report && user && !report.isPreview && (
              <Button size="sm" variant="outline" onClick={handleSaveProject}>
                <Save size={12} className="mr-1" />Save
              </Button>
            )}
            {user ? (
              <div className="flex flex-col items-end">
                <button onClick={() => setCurrentView('dashboard')} className="text-xs font-bold text-gray-700 hover:text-lem-orange">
                  Dashboard
                </button>
                <span className="text-[10px] text-gray-500">
                  {remainingAnalyses === -1 ? 'Premium' : `${remainingAnalyses} left`}
                </span>
              </div>
            ) : (
              <button onClick={() => navigate('/auth')} className="text-xs font-bold text-gray-400 hover:text-lem-orange">
                Sign In
              </button>
            )}
          </div>
        </header>

        {showInfoBanner && (
          <div className="bg-orange-50 border-b border-orange-200 text-orange-900 text-xs px-6 py-2 flex items-center justify-between z-[5]">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-lem-orange"/>
              <span><strong>Note:</strong> Some websites block live previews. The analysis still works!</span>
            </div>
            <button onClick={() => setShowInfoBanner(false)} className="hover:bg-orange-100 p-1 rounded-full"><X size={14} /></button>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 bg-gray-100 relative flex flex-col overflow-hidden">
            {!hasStarted ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto text-gray-500">
                <div className="w-24 h-24 bg-gray-200 rounded-full mb-6 flex items-center justify-center text-4xl grayscale opacity-50">😑</div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Ready to Measure Emotion?</h2>
                <p className="mb-6">Enter a URL above. AI will analyze emotional triggers.</p>
              </div>
            ) : (
              <div className="w-full h-full relative p-6">
                <AnalysisCanvas imgUrl={validUrl} markers={markers} setMarkers={setMarkers} isAnalyzing={isAnalyzing} activeLayer={activeLayer} setActiveLayer={setActiveLayer} screenshot={report?.screenshot} />
              </div>
            )}
          </div>

          <div className="w-96 h-full shadow-xl z-20 bg-white border-l border-gray-200 flex-shrink-0">
            {report?.isPreview && !user ? (
              <div className="h-full flex flex-col">
                <div className="flex-1 blur-sm pointer-events-none">
                  <ReportPanel report={report} markers={markers} isAnalyzing={isAnalyzing} currentUrl={validUrl} activeLayer={activeLayer} setActiveLayer={setActiveLayer} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                  <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
                    <Lock size={48} className="mx-auto mb-4 text-lem-orange" />
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Unlock Full Report</h3>
                    <p className="text-gray-600 mb-6">
                      Sign up for free to get detailed analysis, all markers, and participant testing features!
                    </p>
                    <Button onClick={() => navigate('/auth')} className="w-full bg-lem-orange hover:bg-lem-orange-dark mb-3">
                      Get Started Free
                    </Button>
                    <p className="text-xs text-gray-500">3 free analyses • No credit card required</p>
                  </div>
                </div>
              </div>
            ) : (
              <ReportPanel report={report} markers={markers} isAnalyzing={isAnalyzing} currentUrl={validUrl} activeLayer={activeLayer} setActiveLayer={setActiveLayer} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
