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
  const [showAI, setShowAI] = useState(true);
  const [showHumans, setShowHumans] = useState(true);
  const [remainingAnalyses, setRemainingAnalyses] = useState<{ monthly: number; pack: number; monthlyLimit: number }>({ monthly: 0, pack: 0, monthlyLimit: 10 });
  const [showArchived, setShowArchived] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectSessions, setProjectSessions] = useState<Record<string, number>>({});
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadProjects();
    loadUserRole();
  }, [user, showArchived]);

  const loadUserRole = async () => {
    const remaining = await getRemainingAnalyses(user.id);
    setRemainingAnalyses(remaining);
    
    // Check if user is admin
    const role = await getUserRole(user.id);
    setIsAdmin(role?.role === 'admin');
  };

  useEffect(() => {
    if (selectedProject) {
      loadSessions(selectedProject.id);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    const data = await getProjects(user.id, showArchived);
    setProjects(data);
    
    // Load session counts for each project
    const sessionCounts: Record<string, number> = {};
    await Promise.all(
      data.map(async (project) => {
        const sessions = await getProjectSessions(project.id);
        sessionCounts[project.id] = sessions.length;
      })
    );
    setProjectSessions(sessionCounts);
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
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Decorative emotion stickers */}
      <div className="absolute top-20 right-20 w-16 h-16 opacity-10 rotate-12">
        <img src="https://zuuapuzwnghgdkskkvhc.supabase.co/storage/v1/object/public/LEMemotions/joy.png" alt="Joy" className="w-full h-full" />
      </div>
      <div className="absolute bottom-20 left-20 w-14 h-14 opacity-10 -rotate-12">
        <img src="https://zuuapuzwnghgdkskkvhc.supabase.co/storage/v1/object/public/LEMemotions/interest.png" alt="Interest" className="w-full h-full" />
      </div>
      
      <header className="bg-white border-b border-gray-200 shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 10C27.9086 10 10 27.9086 10 50C10 72.0914 27.9086 90 50 90C72.0914 90 90 72.0914 90 50" stroke="#F26522" strokeWidth="12" strokeLinecap="round"/>
              <path d="M50 25C36.1929 25 25 36.1929 25 50C25 63.8071 36.1929 75 50 75C63.8071 75 75 63.8071 75 50" stroke="#555555" strokeWidth="10" strokeLinecap="round"/>
              <path d="M50 40C44.4772 40 40 44.4772 40 50C40 55.5228 44.4772 60 50 60" stroke="#F26522" strokeWidth="8" strokeLinecap="round"/>
            </svg>
            <div>
              <h1 className="text-xl font-black text-gray-900">LEMtool Dashboard</h1>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-600">{user.email}</p>
                {remainingAnalyses.monthly >= 0 && (
                  <span className="flex items-center gap-1 text-xs font-bold text-lem-orange bg-orange-50 px-2 py-0.5 rounded-full">
                    <Crown size={12} />{remainingAnalyses.monthly}/{remainingAnalyses.monthlyLimit} monthly
                  </span>
                )}
                {remainingAnalyses.pack > 0 ? (
                  <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                    {remainingAnalyses.pack} pack
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            {isAdmin && (
              <Button variant="outline" onClick={() => window.location.href = '/admin'} className="border-primary text-primary hover:bg-primary hover:text-white">
                <Shield size={18} className="mr-2" />
                Admin Panel
              </Button>
            )}
            <Button onClick={onNewAnalysis} className="bg-lem-orange hover:bg-lem-orange-dark">
              <Plus size={18} className="mr-2" />
              New Analysis
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/settings'}>
              Settings
            </Button>
            <Button variant="outline" onClick={onLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <LogOut size={18} className="mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Projects</h2>
            <p className="text-gray-600">Manage your website analyses and participant testing sessions</p>
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

        {projects.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <Layout size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {showArchived ? 'No archived projects' : 'No projects yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {showArchived ? 'Archive projects to see them here' : 'Create your first analysis to get started'}
            </p>
            {!showArchived && (
              <Button onClick={onNewAnalysis} className="bg-lem-orange hover:bg-lem-orange-dark">
                <Plus size={18} className="mr-2" />
                New Analysis
              </Button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                {project.screenshot && (
                  <img
                    src={project.screenshot}
                    alt={project.url}
                    className="w-full h-40 object-cover object-top"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1 truncate">{project.url}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs flex items-center gap-1 bg-orange-100 text-orange-700">
                      <Bot size={10} />
                      Tested by AI
                    </Badge>
                    {projectSessions[project.id] > 0 && (
                      <Badge variant="secondary" className="text-xs flex items-center gap-1 bg-blue-100 text-blue-700">
                        <Users size={10} />
                        {projectSessions[project.id]} {projectSessions[project.id] === 1 ? 'Human' : 'Humans'}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                    <span className="font-bold text-lem-orange">
                      {project.report.overallScore}/100
                    </span>
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
                      className="w-full bg-lem-orange hover:bg-lem-orange-dark"
                      onClick={() => {
                        setSelectedProject(project);
                        setViewMode('fullreport');
                      }}
                    >
                      <FileText size={14} className="mr-2" />
                      Full Report & PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => copyTestLink(project.id)}
                    >
                      <ExternalLink size={14} className="mr-2" />
                      Copy Participant Link
                    </Button>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-gray-600 hover:text-gray-900"
                        onClick={() => handleArchiveProject(project)}
                      >
                        {project.archived ? (
                          <>
                            <ArchiveRestore size={14} className="mr-1" />
                            Restore
                          </>
                        ) : (
                          <>
                            <Archive size={14} className="mr-1" />
                            Archive
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
              className="bg-red-600 hover:bg-red-700 text-white"
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
