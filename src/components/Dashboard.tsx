import { useState, useEffect } from 'react';
import { User, Project, TestSession } from '../types';
import { getProjects, getProjectSessions, deleteProject, archiveProject } from '../services/supabaseService';
import { getRemainingAnalyses, getUserRole } from '../services/userRoleService';
import { Plus, Layout, Users, LogOut, ExternalLink, Calendar, Crown, FileText, Trash2, Archive, ArchiveRestore, Bot, Shield } from 'lucide-react';
import { Button } from './ui/button';
import AnalysisCanvas from './AnalysisCanvas';
import ReportPanel from './ReportPanel';
import FullReportView from './FullReportView';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Badge } from './ui/badge';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onNavigateToAnalysis: (project: Project) => void;
  onNavigateToTest: (project: Project) => void;
  onNewAnalysis: () => void;
}

const Dashboard = ({ user, onLogout, onNavigateToTest, onNewAnalysis }: DashboardProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'fullreport'>('list');
  const [activeLayer, setActiveLayer] = useState<'emotions' | 'needs' | 'strategy'>('emotions');
  const [showAreaView, setShowAreaView] = useState(false);
  const [showAI, setShowAI] = useState(true);
  const [showHumans, setShowHumans] = useState(true);
  const [remainingAnalyses, setRemainingAnalyses] = useState<{ monthly: number; pack: number; monthlyLimit: number }>({ monthly: 0, pack: 0, monthlyLimit: 10 });
  const [showArchived, setShowArchived] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectSessions, setProjectSessions] = useState<Record<string, number>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  useEffect(() => {
    loadProjects();
    loadUserRole();
  }, [user, showArchived]);

  const loadUserRole = async () => {
    console.log('Loading user role for:', user.id);
    const remaining = await getRemainingAnalyses(user.id);
    console.log('Remaining analyses:', remaining);
    setRemainingAnalyses(remaining);
    
    // Check if user is admin
    const role = await getUserRole(user.id);
    console.log('Full user role object:', role);
    console.log('Role value:', role?.role);
    console.log('Is admin check:', role?.role === 'admin');
    setIsAdmin(role?.role === 'admin');
  };

  useEffect(() => {
    if (selectedProject) {
      loadSessions(selectedProject.id);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const data = await getProjects(user.id, showArchived);
      setProjects(data);
      setIsLoadingProjects(false);
      
      // Load session counts in background (don't block UI)
      const sessionCounts: Record<string, number> = {};
      Promise.all(
        data.map(async (project) => {
          try {
            const sessions = await getProjectSessions(project.id);
            sessionCounts[project.id] = sessions.length;
          } catch (e) {
            sessionCounts[project.id] = 0;
          }
        })
      ).then(() => setProjectSessions(sessionCounts));
    } catch (error) {
      console.error('Error loading projects:', error);
      setIsLoadingProjects(false);
    }
  };

  const loadSessions = async (pid: string) => {
    const data = await getProjectSessions(pid);
    setSessions(data);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      await deleteProject(projectToDelete.id);
      toast.success('Project deleted successfully');
      loadProjects();
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      toast.error('Failed to delete project');
      console.error(error);
    }
  };

  const handleArchiveProject = async (project: Project) => {
    try {
      const isArchiving = !project.archived;
      await archiveProject(project.id, isArchiving);
      toast.success(isArchiving ? 'Project archived' : 'Project restored');
      loadProjects();
    } catch (error) {
      toast.error('Failed to archive project');
      console.error(error);
    }
  };

  const getCombinedMarkers = () => {
    if (!selectedProject) return [];
    
    let combined = [];
    if (showAI) combined = [...selectedProject.markers];
    if (showHumans) {
      const humanMarkers = sessions.flatMap(s => s.markers.map(m => ({ ...m, sessionId: s.id })));
      combined = [...combined, ...humanMarkers];
    }
    return combined;
  };

  const copyTestLink = (projectId: string) => {
    const testLink = `${window.location.origin}?test=${projectId}`;
    navigator.clipboard.writeText(testLink);
    toast.success('Participant link copied!', {
      description: 'Share this link with participants so they can provide emotional feedback on the same design.',
    });
  };

  if (viewMode === 'fullreport' && selectedProject) {
    return (
      <FullReportView
        project={selectedProject}
        sessions={sessions}
        onBack={() => {
          setViewMode('list');
          setSelectedProject(null);
        }}
        onCopyParticipantLink={() => copyTestLink(selectedProject.id)}
      />
    );
  }

  if (viewMode === 'detail' && selectedProject) {
    return (
      <div className="flex h-screen w-screen bg-gray-50 overflow-hidden">
        <div className="flex-1 flex flex-col h-full">
          <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shadow-sm">
            <Button
              variant="outline"
              onClick={() => {
                setViewMode('list');
                setSelectedProject(null);
              }}
              className="mr-4"
            >
              ← Back to Dashboard
            </Button>
            <div className="flex-1">
              <h2 className="font-bold text-gray-900">{selectedProject.url}</h2>
              <p className="text-xs text-gray-500">
                {sessions.length} participant session{sessions.length !== 1 ? 's' : ''}
              </p>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 p-6 flex flex-col gap-4">
              <div className="flex gap-3 justify-end items-center bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAI}
                    onChange={(e) => setShowAI(e.target.checked)}
                    className="rounded border-gray-300 text-lem-orange focus:ring-lem-orange"
                  />
                  <span className="text-gray-700">AI Markers</span>
                </label>
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showHumans}
                    onChange={(e) => setShowHumans(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Human Markers</span>
                </label>
              </div>
              <div className="flex-1">
                <AnalysisCanvas
                  imgUrl={selectedProject.url}
                  markers={getCombinedMarkers()}
                  setMarkers={() => {}}
                  isAnalyzing={false}
                  activeLayer={activeLayer}
                  setActiveLayer={setActiveLayer}
                  layoutStructure={selectedProject.report.layoutStructure}
                  screenshot={selectedProject.screenshot}
                  interactionMode="read_only"
                />
              </div>
            </div>
            <div className="w-96 bg-white border-l border-gray-200">
              <ReportPanel
                report={selectedProject.report}
                markers={getCombinedMarkers()}
                isAnalyzing={false}
                currentUrl={selectedProject.url}
                activeLayer={activeLayer}
                setActiveLayer={setActiveLayer}
                screenshot={selectedProject.screenshot}
                showAreaView={showAreaView}
                setShowAreaView={setShowAreaView}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => window.location.href = '/'} className="hover:opacity-80 transition-opacity">
              <img src="/lem-logo.svg" alt="LEM" className="w-10 h-10" />
            </button>
            <div>
              <h1 className="text-xl font-black text-foreground">Dashboard</h1>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">{user.email}</p>
                {isAdmin ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    <Crown size={12} />Unlimited
                  </span>
                ) : (
                  <>
                    {remainingAnalyses.monthly >= 0 && (
                      <span className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {remainingAnalyses.monthly}/{remainingAnalyses.monthlyLimit} monthly
                      </span>
                    )}
                    {remainingAnalyses.pack > 0 && (
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        +{remainingAnalyses.pack} pack
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            {isAdmin && (
              <Button variant="outline" onClick={() => window.location.href = '/admin'} className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <Shield size={18} className="mr-2" />
                Admin
              </Button>
            )}
            <Button onClick={onNewAnalysis} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus size={18} className="mr-2" />
              New Analysis
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/settings'}>
              Settings
            </Button>
            <Button variant="outline" onClick={onLogout} className="text-destructive hover:text-destructive hover:bg-destructive/10">
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-1">Your Projects</h2>
            <p className="text-muted-foreground">Manage your website analyses and participant testing sessions</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2"
          >
            {showArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
            {showArchived ? 'Show Active' : 'Show Archived'}
          </Button>
        </div>

        {isLoadingProjects ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden animate-pulse">
                <div className="w-full h-44 bg-muted" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="flex gap-2 mt-4">
                    <div className="h-9 bg-muted rounded flex-1" />
                    <div className="h-9 bg-muted rounded w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-card rounded-2xl border-2 border-dashed border-border p-16 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
              <Layout size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              {showArchived ? 'No archived projects' : 'No projects yet'}
            </h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {showArchived ? 'Archive projects to see them here' : 'Create your first analysis to discover the emotional impact of any website'}
            </p>
            {!showArchived && (
              <Button onClick={onNewAnalysis} className="bg-primary hover:bg-primary/90 text-primary-foreground" size="lg">
                <Plus size={18} className="mr-2" />
                New Analysis
              </Button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-card rounded-xl border border-border shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 overflow-hidden group">
                <div className="relative">
                  {project.screenshot && (
                    <img
                      src={project.screenshot}
                      alt={project.url}
                      className="w-full h-44 object-cover object-top group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  )}
                  <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg">
                    <span className="font-black text-primary text-sm">{project.report.overallScore}/100</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-foreground mb-2 truncate text-lg">{project.url}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs flex items-center gap-1 bg-primary/10 text-primary">
                      <Bot size={10} />
                      AI Analysis
                    </Badge>
                    {projectSessions[project.id] > 0 && (
                      <Badge variant="secondary" className="text-xs flex items-center gap-1 bg-blue-500/10 text-blue-600">
                        <Users size={10} />
                        {projectSessions[project.id]} {projectSessions[project.id] === 1 ? 'Participant' : 'Participants'}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mb-4">
                    <Calendar size={12} className="mr-1" />
                    {new Date(project.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedProject(project);
                          setViewMode('detail');
                        }}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onNavigateToTest(project)}
                      >
                        <Users size={14} className="mr-1" />
                        Test
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => {
                        setSelectedProject(project);
                        setViewMode('fullreport');
                      }}
                    >
                      <FileText size={14} className="mr-2" />
                      Full Report
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 text-muted-foreground hover:text-foreground"
                        onClick={() => copyTestLink(project.id)}
                      >
                        <ExternalLink size={14} className="mr-1" />
                        Share
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => handleArchiveProject(project)}
                      >
                        {project.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          setProjectToDelete(project);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{projectToDelete?.url}&rdquo;? This action cannot be undone. 
              All analysis data and participant sessions will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
