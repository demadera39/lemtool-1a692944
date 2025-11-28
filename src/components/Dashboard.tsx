import { useState, useEffect } from 'react';
import { User, Project, TestSession } from '../types';
import { getProjects, getProjectSessions } from '../services/supabaseService';
import { getRemainingAnalyses } from '../services/userRoleService';
import { Plus, Layout, Users, LogOut, ExternalLink, Calendar, Crown } from 'lucide-react';
import { Button } from './ui/button';
import AnalysisCanvas from './AnalysisCanvas';
import ReportPanel from './ReportPanel';

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
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [activeLayer, setActiveLayer] = useState<'emotions' | 'needs' | 'strategy'>('emotions');
  const [showAI, setShowAI] = useState(true);
  const [showHumans, setShowHumans] = useState(true);
  const [remainingAnalyses, setRemainingAnalyses] = useState<number>(-1);

  useEffect(() => {
    loadProjects();
    loadUserRole();
  }, [user]);

  const loadUserRole = async () => {
    const remaining = await getRemainingAnalyses(user.id);
    setRemainingAnalyses(remaining);
  };

  useEffect(() => {
    if (selectedProject) {
      loadSessions(selectedProject.id);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    const data = await getProjects(user.id);
    setProjects(data);
  };

  const loadSessions = async (pid: string) => {
    const data = await getProjectSessions(pid);
    setSessions(data);
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
    alert('Test link copied to clipboard!');
  };

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
            <div className="flex gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showAI}
                  onChange={(e) => setShowAI(e.target.checked)}
                  className="rounded border-gray-300"
                />
                AI Markers
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showHumans}
                  onChange={(e) => setShowHumans(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Human Markers
              </label>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 p-6">
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
            <div className="w-96 bg-white border-l border-gray-200">
              <ReportPanel
                report={selectedProject.report}
                markers={getCombinedMarkers()}
                isAnalyzing={false}
                currentUrl={selectedProject.url}
                activeLayer={activeLayer}
                setActiveLayer={setActiveLayer}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 10C27.9086 10 10 27.9086 10 50C10 72.0914 27.9086 90 50 90C72.0914 90 90 72.0914 90 50" stroke="#F26522" strokeWidth="12" strokeLinecap="round"/>
              <path d="M50 25C36.1929 25 25 36.1929 25 50C25 63.8071 36.1929 75 50 75C63.8071 75 75 63.8071 75 50" stroke="#555555" strokeWidth="10" strokeLinecap="round"/>
              <path d="M50 40C44.4772 40 40 44.4772 40 50C40 55.5228 44.4772 60 50 60" stroke="#F26522" strokeWidth="8" strokeLinecap="round"/>
            </svg>
            <div>
              <h1 className="text-xl font-black text-gray-900">LEMtool Dashboard</h1>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-500">{user.email}</p>
                {remainingAnalyses === -1 ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-lem-orange">
                    <Crown size={12} />Premium
                  </span>
                ) : (
                  <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                    {remainingAnalyses} analyses left
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={onNewAnalysis} className="bg-lem-orange hover:bg-lem-orange-dark">
              <Plus size={18} className="mr-2" />
              New Analysis
            </Button>
            <Button variant="outline" onClick={onLogout}>
              <LogOut size={18} className="mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Projects</h2>
          <p className="text-gray-600">Manage your website analyses and participant testing sessions</p>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <Layout size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-6">Create your first analysis to get started</p>
            <Button onClick={onNewAnalysis} className="bg-lem-orange hover:bg-lem-orange-dark">
              <Plus size={18} className="mr-2" />
              New Analysis
            </Button>
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
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                    <span className="font-bold text-lem-orange">
                      {project.report.overallScore}/100
                    </span>
                  </div>
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyTestLink(project.id)}
                      title="Copy test link"
                    >
                      <ExternalLink size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
