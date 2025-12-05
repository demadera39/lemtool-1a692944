import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Toolbar from '@/components/Toolbar';
import AnalysisCanvas from '@/components/AnalysisCanvas';
import ReportPanel from '@/components/ReportPanel';
import Dashboard from '@/components/Dashboard';
import ParticipantView from '@/components/ParticipantView';
import EmotionToken from '@/components/EmotionToken';
import LandingHero from '@/components/LandingHero';
import { UpgradeModal } from '@/components/UpgradeModal';
import { PremiumUpgradeModal } from '@/components/PremiumUpgradeModal';
import { Marker, EmotionType, User, LayerType, Project } from '@/types';
import { analyzeWebsite } from '@/services/geminiService';
import { supabase, signOut, createProject, getProjectById, ensureProfile } from '@/services/supabaseService';
import { getUserRole, canCreateAnalysis, incrementAnalysisCount, getRemainingAnalyses } from '@/services/userRoleService';
import { Search, AlertCircle, X, Lock, User as UserIcon, LogOut, Settings as SettingsIcon } from 'lucide-react';
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPremiumUpgradeModal, setShowPremiumUpgradeModal] = useState(false);
  const [userRole, setUserRole] = useState<'free' | 'premium' | 'admin' | null>(null);

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
    
    // Get user role to determine which modal to show
    const role = await getUserRole(userId);
    setUserRole(role?.role || 'free');
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
        // Keep more emotion markers for preview display (teaser showing richness of analysis)
        const emotionMarkers = result.markers.filter(m => m.layer === 'emotions' && m.emotion).slice(0, 25);
        setMarkers(emotionMarkers);
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
      // Show different modals based on user role
      if (userRole === 'free') {
        setShowPremiumUpgradeModal(true);
      } else {
        setShowUpgradeModal(true);
      }
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
        onNewAnalysis={() => { setHasStarted(false); setReport(null); setMarkers([]); }}
      />
    );
  }

  // Show landing hero when analysis hasn't started
  if (!hasStarted) {
    const handleHeroAnalyze = (inputUrl: string) => {
      setUrl(inputUrl);
      // Trigger the form submission logic
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
      setUrl(inputUrl);
      // Directly call analysis logic
      let targetUrl = inputUrl.trim();
      if (!targetUrl.match(/^https?:\/\//i)) targetUrl = 'https://' + targetUrl;
      
      if (!user) {
        // Anonymous preview mode
        setUrl(targetUrl);
        setValidUrl(targetUrl);
        setHasStarted(true);
        setIsAnalyzing(true);
        setAnalysisProgress(0);
        setMarkers([]);
        setReport(null);
        setActiveLayer('emotions');

        analyzeWebsite(targetUrl, (progress) => {
          setAnalysisProgress(progress);
        }).then(result => {
          const emotionMarkers = result.markers.filter(m => m.layer === 'emotions' && m.emotion).slice(0, 25);
          setMarkers(emotionMarkers);
          setReport({ ...result.report, isPreview: true });
          toast.info('Preview mode - Sign up for full analysis!');
        }).catch(error => {
          console.error("Analysis Error:", error);
          toast.error('Analysis failed.');
        }).finally(() => {
          setIsAnalyzing(false);
        });
        return;
      }

      // Logged in user flow
      canCreateAnalysis(user.id).then(canCreate => {
        if (!canCreate) {
          if (userRole === 'free') {
            setShowPremiumUpgradeModal(true);
          } else {
            setShowUpgradeModal(true);
          }
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

        analyzeWebsite(targetUrl, (progress) => {
          setAnalysisProgress(progress);
        }).then(async result => {
          setMarkers(result.markers);
          setReport(result.report);
          await incrementAnalysisCount(user.id);
          await loadUserRole(user.id);
          await ensureProfile(user.id, user.email, user.name);
          await createProject(user.id, targetUrl, result.report, result.markers);
          toast.success('Analysis complete and saved!');
          setCurrentView('dashboard');
        }).catch(error => {
          console.error("Analysis Error:", error);
          toast.error('Analysis failed.');
        }).finally(() => {
          setIsAnalyzing(false);
        });
      });
    };

    return (
      <>
        <PremiumUpgradeModal open={showPremiumUpgradeModal} onOpenChange={setShowPremiumUpgradeModal} />
        <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
        <LandingHero onAnalyze={handleHeroAnalyze} isAnalyzing={isAnalyzing} />
      </>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden">
      <PremiumUpgradeModal open={showPremiumUpgradeModal} onOpenChange={setShowPremiumUpgradeModal} />
      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
      <Toolbar onAddMarker={handleAddMarker} selectedEmotion={null} />

      <div className="flex-1 flex flex-col h-full relative">
        <header className="h-14 bg-card border-b border-border flex items-center px-4 shadow-sm z-10 justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <img src="/lem-logo.svg" alt="LEM" className="w-6 h-6" />
            <span className="font-bold text-foreground">LEMTOOL</span>
          </div>

          <form onSubmit={handleAnalyze} className="flex-1 max-w-xl mx-auto flex items-center gap-2">
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-muted-foreground group-focus-within:text-primary" />
              </div>
              <Input type="text" placeholder="Enter website URL..." className="pl-10 h-9" value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
            <Button type="submit" disabled={isAnalyzing || !url} size="sm" className="bg-primary hover:bg-primary/90">
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </Button>
          </form>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  {(remainingAnalyses.monthly > 0 || remainingAnalyses.pack > 0) ? (
                    <>
                      {remainingAnalyses.monthly > 0 && (
                        <span className="font-bold text-primary">
                          {remainingAnalyses.monthly} left
                        </span>
                      )}
                      {remainingAnalyses.pack > 0 && (
                        <span className="text-muted-foreground">+{remainingAnalyses.pack}</span>
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground">0 left</span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentView('dashboard')}
                  className="text-xs h-8"
                >
                  Dashboard
                </Button>
                <div className="relative group">
                  <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors">
                    <UserIcon size={16} className="text-muted-foreground" />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-card rounded-lg shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <button
                      onClick={() => navigate('/settings')}
                      className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2 rounded-t-lg"
                    >
                      <SettingsIcon size={16} />
                      Settings
                    </button>
                    <button
                      onClick={async () => { await signOut(); setUser(null); setHasStarted(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2 rounded-b-lg"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Button onClick={() => navigate('/auth')} size="sm" className="bg-primary hover:bg-primary/90 h-8">
                Sign In
              </Button>
            )}
          </div>
        </header>

        {showInfoBanner && (
          <div className="bg-accent border-b border-primary/20 text-accent-foreground text-xs px-6 py-2 flex items-center justify-between z-[5]">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-primary"/>
              <span><strong>Note:</strong> Some websites block live previews. The analysis still works!</span>
            </div>
            <button onClick={() => setShowInfoBanner(false)} className="hover:bg-primary/10 p-1 rounded-full"><X size={14} /></button>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 bg-muted/50 relative flex flex-col overflow-hidden">
            <div className={`w-full h-full relative ${report?.isPreview && !user ? 'overflow-hidden' : ''}`}>
              {report?.isPreview && !user && report?.screenshot ? (
                <div className="animate-gentle-scroll w-full relative">
                  <img 
                    src={report.screenshot} 
                    alt="Website preview" 
                    className="w-full h-auto"
                  />
                  {/* Overlay markers on the scrolling screenshot */}
                  {markers.filter(m => m.layer === 'emotions' && m.emotion).map(marker => (
                    <div
                      key={marker.id}
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                    >
                      <div className="transform scale-150 origin-center">
                        <EmotionToken emotion={marker.emotion!} size="lg" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full h-full p-6">
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
          </div>

          <div className="w-96 h-full shadow-xl z-20 bg-card border-l border-border flex-shrink-0">
            {report?.isPreview && !user ? (
              <div className="h-full flex flex-col">
                <div className="flex-1 blur-sm pointer-events-none">
                  <ReportPanel report={report} markers={markers} isAnalyzing={isAnalyzing} currentUrl={validUrl} activeLayer={activeLayer} setActiveLayer={setActiveLayer} screenshot={report?.screenshot} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm">
                  <div className="bg-card rounded-2xl shadow-2xl p-8 max-w-md text-center border border-border">
                    <Lock size={48} className="mx-auto mb-4 text-primary" />
                    <h3 className="text-2xl font-black text-foreground mb-2">Unlock Full Report</h3>
                    <p className="text-muted-foreground mb-6">
                      Sign up for free to get detailed analysis, all markers, and participant testing features!
                    </p>
                    <Button onClick={() => {
                      try {
                        localStorage.setItem('pendingAnalysis', JSON.stringify({ url: validUrl }));
                      } catch (e) {
                        console.warn('Could not save pending analysis to localStorage:', e);
                      }
                      navigate('/auth?mode=signup');
                    }} className="w-full bg-primary hover:bg-primary/90 mb-3">
                      Get Started Free
                    </Button>
                    <p className="text-xs text-muted-foreground">3 free analyses • No credit card required</p>
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
