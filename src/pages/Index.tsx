import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Toolbar from '@/components/Toolbar';
import AnalysisCanvas from '@/components/AnalysisCanvas';
import ReportPanel from '@/components/ReportPanel';
import Dashboard from '@/components/Dashboard';
import ParticipantView from '@/components/ParticipantView';
import { Marker, EmotionType, User, LayerType, Project } from '@/types';
import { analyzeWebsite } from '@/services/geminiService';
import { supabase, signOut, createProject, getProjectById, ensureProfile } from '@/services/supabaseService';
import { getUserRole, canCreateAnalysis, incrementAnalysisCount, getRemainingAnalyses } from '@/services/userRoleService';
import { Search, Info, AlertCircle, X, Save, Lock, DollarSign, User as UserIcon, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'participant'>('landing');
  const [testProject, setTestProject] = useState<Project | null>(null);
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [report, setReport] = useState<any>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [validUrl, setValidUrl] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [activeLayer, setActiveLayer] = useState<LayerType>('emotions');
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const [remainingAnalyses, setRemainingAnalyses] = useState<{ monthly: number; pack: number; monthlyLimit: number }>({ monthly: 0, pack: 0, monthlyLimit: 10 });

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
        setTimeout(() => checkSubscription(session.user.id), 0);
        loadUserRole(session.user.id);
      } else {
        setUser(null);
        setRemainingAnalyses({ monthly: 0, pack: 0, monthlyLimit: 10 });
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
        setTimeout(() => checkSubscription(session.user.id), 0);
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

  const checkSubscription = async (userId: string) => {
    try {
      // Check if we have a valid session before calling the function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No active session, skipping subscription check');
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }
      
      // Reload user role after subscription check to get updated limits
      await loadUserRole(userId);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

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
      setAnalysisProgress(0);
      setMarkers([]);
      setReport(null);
      setActiveLayer('emotions');

      try {
        const result = await analyzeWebsite(targetUrl, (progress, message) => {
          setAnalysisProgress(progress);
        });
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
    setAnalysisProgress(0);
    setMarkers([]);
    setReport(null);
    setActiveLayer('emotions');

    try {
      const result = await analyzeWebsite(targetUrl, (progress, message) => {
        setAnalysisProgress(progress);
      });
      setMarkers(result.markers);
      setReport(result.report);
      await incrementAnalysisCount(user.id);
      await loadUserRole(user.id);
      
      // Ensure profile exists before saving project
      await ensureProfile(user.id, user.email, user.name);
      
      // Auto-save project for logged-in users
      const savedProject = await createProject(user.id, targetUrl, result.report, result.markers);
      toast.success('Analysis complete and saved!');
      
      // Navigate to dashboard and open the project
      setCurrentView('dashboard');
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
      <Toolbar onAddMarker={handleAddMarker} selectedEmotion={null} />

      <div className="flex-1 flex flex-col h-full relative">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shadow-sm z-10 justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/about')} className="text-sm font-medium text-gray-600 hover:text-lem-orange transition-colors">
              About
            </button>
            <button onClick={() => navigate('/pricing')} className="text-sm font-medium text-gray-600 hover:text-lem-orange transition-colors">
              Pricing
            </button>
            <button onClick={() => navigate('/support')} className="text-sm font-medium text-gray-600 hover:text-lem-orange transition-colors">
              Support
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

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-600 flex items-center gap-2">
                  {(remainingAnalyses.monthly > 0 || remainingAnalyses.pack > 0) ? (
                    <>
                      {remainingAnalyses.monthly > 0 && (
                        <span className="font-bold text-lem-orange">
                          {remainingAnalyses.monthly} {remainingAnalyses.monthly === 1 ? 'analysis' : 'analyses'} remaining
                        </span>
                      )}
                      {remainingAnalyses.pack > 0 && (
                        <span className="text-gray-600">+ {remainingAnalyses.pack} pack</span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-500">0 analyses left</span>
                  )}
                </div>
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <UserIcon size={18} className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">{user.name || user.email.split('@')[0]}</span>
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <button
                      onClick={() => setCurrentView('dashboard')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 rounded-t-lg"
                    >
                      <UserIcon size={16} />
                      Dashboard
                    </button>
                    <button
                      onClick={() => navigate('/settings')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <SettingsIcon size={16} />
                      Settings
                    </button>
                    <button
                      onClick={async () => { await signOut(); setUser(null); setCurrentView('landing'); }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Button onClick={() => navigate('/auth')} size="sm" className="bg-lem-orange hover:bg-lem-orange-dark">
                Sign In
              </Button>
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
                <div className="w-24 h-24 bg-gray-200 rounded-full mb-6 flex items-center justify-center overflow-hidden">
                  <img 
                    src="https://zuuapuzwnghgdkskkvhc.supabase.co/storage/v1/object/public/LEMemotions/neutral.png" 
                    alt="Neutral emotion" 
                    className="w-full h-full opacity-50 grayscale"
                  />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Ready to Measure Emotion?</h2>
                <p className="mb-6">Enter a URL above. AI will analyze emotional triggers.</p>
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
                  analysisProgress={analysisProgress}
                />
              </div>
            )}
          </div>

          <div className="w-96 h-full shadow-xl z-20 bg-white border-l border-gray-200 flex-shrink-0">
            {report?.isPreview && !user ? (
              <div className="h-full flex flex-col">
                <div className="flex-1 blur-sm pointer-events-none">
                  <ReportPanel report={report} markers={markers} isAnalyzing={isAnalyzing} currentUrl={validUrl} activeLayer={activeLayer} setActiveLayer={setActiveLayer} screenshot={report?.screenshot} />
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
              <ReportPanel report={report} markers={markers} isAnalyzing={isAnalyzing} currentUrl={validUrl} activeLayer={activeLayer} setActiveLayer={setActiveLayer} screenshot={report?.screenshot} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
