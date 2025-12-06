import { useState } from 'react';
import { Project, TestSession, Marker, LayerType, Recommendation } from '@/types';
import { Button } from './ui/button';
import { ArrowLeft, Download, Share2, Users, Heart, Brain, Lightbulb, Grid3x3, MapPin, Map, AlertTriangle, Palette, Type, MousePointer, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { EMOTIONS } from '@/constants';
import EmotionToken from './EmotionToken';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
// Recommendation Card Component
const RecommendationCard = ({ rec, color }: { rec: Recommendation; color: 'purple' | 'blue' | 'green' }) => {
  const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-gray-100 text-gray-600 border-gray-200'
  };
  
  const accentColors = {
    purple: 'border-purple-200 bg-purple-50',
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50'
  };

  return (
    <div className={`border rounded-lg p-4 ${accentColors[color]}`}>
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-bold text-gray-900">{rec.title}</h4>
        <Badge className={`text-xs ${priorityColors[rec.priority]}`}>
          {rec.priority} priority
        </Badge>
      </div>
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Current Issue</p>
          <p className="text-sm text-gray-700">{rec.current}</p>
        </div>
        <div className="flex items-start gap-2">
          <ChevronRight size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Recommendation</p>
            <p className="text-sm text-gray-900 font-medium">{rec.recommendation}</p>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Why This Matters</p>
          <p className="text-sm text-gray-600">{rec.rationale}</p>
        </div>
        {rec.example && (
          <div className="border-t border-gray-200 pt-2 mt-2">
            <p className="text-xs text-gray-500">
              <span className="font-semibold">Example: </span>{rec.example}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface FullReportViewProps {
  project: Project;
  sessions: TestSession[];
  onBack: () => void;
  onCopyParticipantLink: () => void;
}
const FullReportView = ({
  project,
  sessions,
  onBack,
  onCopyParticipantLink
}: FullReportViewProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [areaViewLayer, setAreaViewLayer] = useState<LayerType>('emotions');
  const [areaViewSource, setAreaViewSource] = useState<'all' | 'ai' | 'human'>('all');
  const [areaViewMode, setAreaViewMode] = useState<'heatmap' | 'points'>('points');
  const [selectedSession, setSelectedSession] = useState<string>('all');
  
  const allMarkers = [...project.markers, ...sessions.flatMap(s => s.markers)];
  const areaMarkers = allMarkers.filter(m => m.isArea);
  const uniqueSessions = Array.from(new Set(sessions.map(s => s.id)));
  
  const getFilteredMarkers = () => {
    let filtered = allMarkers.filter(m => m.layer === areaViewLayer);
    
    if (areaViewMode === 'heatmap') {
      filtered = filtered.filter(m => m.isArea);
    } else {
      filtered = filtered.filter(m => !m.isArea);
    }
    
    if (areaViewSource === 'ai') {
      filtered = filtered.filter(m => m.source === 'AI');
    } else if (areaViewSource === 'human') {
      filtered = filtered.filter(m => m.source === 'HUMAN');
    }
    
    if (selectedSession !== 'all') {
      if (selectedSession === 'ai') {
        filtered = filtered.filter(m => m.source === 'AI');
      } else {
        filtered = filtered.filter(m => m.sessionId === selectedSession);
      }
    }
    
    return filtered;
  };
  
  const filteredMarkers = getFilteredMarkers();
  
  const exportToPDF = async () => {
    setIsExporting(true);
    toast.info('Generating PDF...', {
      description: 'This may take a moment'
    });
    try {
      const reportElement = document.getElementById('full-report-content');
      if (!reportElement) return;
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        windowHeight: reportElement.scrollHeight,
        onclone: clonedDoc => {
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            @media print {
              .pdf-no-break {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              .pdf-page-break-before {
                page-break-before: always !important;
              }
            }
          `;
          clonedDoc.head.appendChild(style);
        }
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = canvas.height * pdfWidth / canvas.width;
      const margin = 10;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      while (heightLeft > margin) {
        position = -(imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      const fileName = `LEM-Report-${new URL(project.url).hostname}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };
  
  const emotionCounts = allMarkers.reduce((acc, m) => {
    if (m.emotion) {
      acc[m.emotion] = (acc[m.emotion] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  const topEmotions = Object.entries(emotionCounts).sort(([, a], [, b]) => b - a).slice(0, 5);
  return <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft size={18} className="mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-xl font-black text-gray-900">Full Analysis Report</h1>
              <p className="text-sm text-gray-500 truncate max-w-md">{project.url}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCopyParticipantLink}>
              <Share2 size={18} className="mr-2" />
              Share with Participants
            </Button>
            <Button onClick={exportToPDF} disabled={isExporting} className="bg-lem-orange hover:bg-lem-orange-dark">
              <Download size={18} className="mr-2" />
              {isExporting ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>
        </div>
      </header>

      {/* Report Content */}
      <div id="full-report-content" className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <Card className="mb-6 bg-gradient-to-br from-lem-orange to-orange-600 text-white border-0">
          <CardContent className="p-8 opacity-80">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 10C27.9086 10 10 27.9086 10 50C10 72.0914 27.9086 90 50 90C72.0914 90 90 72.0914 90 50" stroke="white" strokeWidth="12" strokeLinecap="round" />
                    <path d="M50 25C36.1929 25 25 36.1929 25 50C25 63.8071 36.1929 75 50 75C63.8071 75 75 63.8071 75 50" stroke="white" strokeWidth="10" strokeLinecap="round" opacity="0.6" />
                  </svg>
                  <h2 className="text-3xl font-black">LEMtool METHOD</h2>
                </div>
                <p className="text-white/90 text-sm mb-4">Target: {project.url}</p>
                <p className="text-white/80 text-xs">
                  Generated: {new Date(project.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
                </p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 text-center">
                <p className="text-xs text-white/80 uppercase tracking-wider mb-1">Emotional Impact Score</p>
                <p className="text-6xl font-black">{project.report.overallScore}</p>
                <p className="text-2xl font-black">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="mb-6 pdf-no-break">
          <CardHeader>
            <CardTitle className="text-2xl">Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">{project.report.summary}</p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Participant Data */}
          <Card className="pdf-no-break">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="text-lem-orange" size={20} />
                Participant Testing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Participants</span>
                  <span className="text-2xl font-black text-lem-orange">{sessions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">AI Analysis Markers</span>
                  <span className="text-2xl font-black">{project.markers.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Human Markers</span>
                  <span className="text-2xl font-black">{sessions.reduce((sum, s) => sum + s.markers.length, 0)}</span>
                </div>
                <Button onClick={onCopyParticipantLink} className="w-full bg-lem-orange hover:bg-lem-orange-dark mt-4">
                  <Share2 size={16} className="mr-2" />
                  Invite More Participants
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Audience Breakdown */}
          <Card className="pdf-no-break">
            <CardHeader>
              <CardTitle>Detected Brand Values</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {project.report.keyFindings.slice(0, 3).map((finding, idx) => <Badge key={idx} variant="outline" className="w-full justify-start text-left py-2">
                    {finding.title}
                  </Badge>)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Personas Section */}
        {project.report.personas && project.report.personas.length > 0 && (
          <Card className="mb-6 pdf-no-break">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="text-lem-orange" size={20} />
                Target Personas
              </CardTitle>
              <p className="text-sm text-gray-500">User archetypes identified from website content and design</p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.report.personas.map((persona, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-gray-50 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-gray-900">{persona.name}</h4>
                        <p className="text-sm text-gray-600">{persona.role}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {persona.techLiteracy} Tech
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-3 italic border-l-2 border-lem-orange pl-3">
                      "{persona.quote}"
                    </p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Goals</p>
                        <p className="text-sm text-gray-700">{persona.goals}</p>
                      </div>
                      {persona.frustrations && persona.frustrations.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase">Frustrations</p>
                          <ul className="text-sm text-gray-700 list-disc list-inside">
                            {persona.frustrations.slice(0, 2).map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {persona.values && persona.values.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {persona.values.map((v, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{v}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Categorized Recommendations */}
        {project.report.recommendations && (
          <div className="mb-6 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Detailed Recommendations</h2>
            
            {/* Design Recommendations */}
            {project.report.recommendations.design && project.report.recommendations.design.length > 0 && (
              <Card className="pdf-no-break border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="text-purple-500" size={20} />
                    Design Recommendations
                  </CardTitle>
                  <p className="text-sm text-gray-500">Visual design, layout, colors, typography, and imagery improvements</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.report.recommendations.design.map((rec, idx) => (
                    <RecommendationCard key={idx} rec={rec} color="purple" />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Copy Recommendations */}
            {project.report.recommendations.copy && project.report.recommendations.copy.length > 0 && (
              <Card className="pdf-no-break border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="text-blue-500" size={20} />
                    Copy Recommendations
                  </CardTitle>
                  <p className="text-sm text-gray-500">Headlines, messaging, tone of voice, and persuasive writing improvements</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.report.recommendations.copy.map((rec, idx) => (
                    <RecommendationCard key={idx} rec={rec} color="blue" />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* UX Recommendations */}
            {project.report.recommendations.ux && project.report.recommendations.ux.length > 0 && (
              <Card className="pdf-no-break border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MousePointer className="text-green-500" size={20} />
                    UX & Interaction Recommendations
                  </CardTitle>
                  <p className="text-sm text-gray-500">User flows, navigation, interactions, and usability improvements</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.report.recommendations.ux.map((rec, idx) => (
                    <RecommendationCard key={idx} rec={rec} color="green" />
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Visual Overview with Markers */}
        {project.screenshot && <Card className="mb-6 pdf-no-break">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <CardTitle className="text-xl">Visual Analysis Overview</CardTitle>
                  <p className="text-sm text-gray-500">Complete page with emotional markers and legend</p>
                </div>
              </div>
              
              {/* Filter Controls */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Layer Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 block">Layer</label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={areaViewLayer === 'emotions' ? 'default' : 'outline'}
                        onClick={() => setAreaViewLayer('emotions')}
                        className={`h-9 text-xs font-medium px-3 ${areaViewLayer === 'emotions' ? 'bg-lem-orange hover:bg-lem-orange text-white border-lem-orange' : 'bg-white hover:bg-gray-50'}`}
                      >
                        <Heart size={14} className="mr-1.5" />
                        Emotions
                      </Button>
                      <Button
                        size="sm"
                        variant={areaViewLayer === 'needs' ? 'default' : 'outline'}
                        onClick={() => setAreaViewLayer('needs')}
                        className={`h-9 text-xs font-medium px-3 ${areaViewLayer === 'needs' ? 'bg-lem-orange hover:bg-lem-orange text-white border-lem-orange' : 'bg-white hover:bg-gray-50'}`}
                      >
                        <Brain size={14} className="mr-1.5" />
                        Needs
                      </Button>
                      <Button
                        size="sm"
                        variant={areaViewLayer === 'strategy' ? 'default' : 'outline'}
                        onClick={() => setAreaViewLayer('strategy')}
                        className={`h-9 text-xs font-medium px-3 ${areaViewLayer === 'strategy' ? 'bg-lem-orange hover:bg-lem-orange text-white border-lem-orange' : 'bg-white hover:bg-gray-50'}`}
                      >
                        <Lightbulb size={14} className="mr-1.5" />
                        Strategy
                      </Button>
                    </div>
                  </div>

                  {/* Source Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 block">Source</label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={areaViewSource === 'all' ? 'default' : 'outline'}
                        onClick={() => setAreaViewSource('all')}
                        className={`h-9 text-xs font-medium px-3 ${areaViewSource === 'all' ? 'bg-lem-orange hover:bg-lem-orange text-white border-lem-orange' : 'bg-white hover:bg-gray-50'}`}
                      >
                        All
                      </Button>
                      <Button
                        size="sm"
                        variant={areaViewSource === 'ai' ? 'default' : 'outline'}
                        onClick={() => setAreaViewSource('ai')}
                        className={`h-9 text-xs font-medium px-3 ${areaViewSource === 'ai' ? 'bg-lem-orange hover:bg-lem-orange text-white border-lem-orange' : 'bg-white hover:bg-gray-50'}`}
                      >
                        AI
                      </Button>
                      <Button
                        size="sm"
                        variant={areaViewSource === 'human' ? 'default' : 'outline'}
                        onClick={() => setAreaViewSource('human')}
                        className={`h-9 text-xs font-medium px-3 ${areaViewSource === 'human' ? 'bg-lem-orange hover:bg-lem-orange text-white border-lem-orange' : 'bg-white hover:bg-gray-50'}`}
                      >
                        Human
                      </Button>
                    </div>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 block">View</label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={areaViewMode === 'points' ? 'default' : 'outline'}
                        onClick={() => setAreaViewMode('points')}
                        className={`h-9 text-xs font-medium px-3 ${areaViewMode === 'points' ? 'bg-lem-orange hover:bg-lem-orange text-white border-lem-orange' : 'bg-white hover:bg-gray-50'}`}
                      >
                        <MapPin size={14} className="mr-1.5" />
                        Points
                      </Button>
                      <Button
                        size="sm"
                        variant={areaViewMode === 'heatmap' ? 'default' : 'outline'}
                        onClick={() => setAreaViewMode('heatmap')}
                        className={`h-9 text-xs font-medium px-3 ${areaViewMode === 'heatmap' ? 'bg-lem-orange hover:bg-lem-orange text-white border-lem-orange' : 'bg-white hover:bg-gray-50'}`}
                      >
                        <Grid3x3 size={14} className="mr-1.5" />
                        Areas
                      </Button>
                    </div>
                  </div>

                  {/* Participant Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 block">Participant</label>
                    <Select value={selectedSession} onValueChange={setSelectedSession}>
                      <SelectTrigger className="h-9 bg-white border-gray-300 hover:bg-gray-50">
                        <SelectValue placeholder="All participants" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50 border shadow-lg">
                        <SelectItem value="all">All participants</SelectItem>
                        <SelectItem value="ai">AI only</SelectItem>
                        {uniqueSessions.map((sessionId) => (
                          <SelectItem key={sessionId} value={sessionId}>
                            Session {sessionId.slice(-6)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Conditional Legend based on Layer */}
                {areaViewLayer === 'emotions' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg">
                    {Object.values(EMOTIONS).map(emotion => (
                      <div key={emotion.id} className="flex items-center gap-2">
                        <EmotionToken emotion={emotion.id} size="sm" />
                        <span className="text-xs font-medium text-gray-700">{emotion.label}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {areaViewLayer === 'needs' && (
                  <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center">
                        <Users size={20} className="text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">Autonomy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-green-400 flex items-center justify-center">
                        <Brain size={20} className="text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">Competence</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-pink-400 flex items-center justify-center">
                        <Heart size={20} className="text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">Relatedness</span>
                    </div>
                  </div>
                )}
                
                {areaViewLayer === 'strategy' && (
                  <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                        <Lightbulb size={20} className="text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">Opportunity</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                        <AlertTriangle size={20} className="text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">Pain Point</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                        <Brain size={20} className="text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">Insight</span>
                    </div>
                  </div>
                )}
                
                {/* Screenshot with Filtered Markers */}
                <div className="relative border border-gray-200 rounded-lg bg-gray-100 h-[70vh] overflow-hidden">
                  <div className="absolute inset-0 overflow-y-auto">
                    <div className="relative w-full">
                      <img src={project.screenshot} alt="Analysis overview" className="w-full h-auto block" />
                      <div className="absolute inset-0 pointer-events-none">
                    {areaViewMode === 'heatmap' ? (
                      filteredMarkers.filter(m => m.isArea && m.width && m.height).map((marker, idx) => {
                        if (areaViewLayer === 'emotions') {
                          const isPositive = marker.emotion && ['Joy', 'Desire', 'Fascination', 'Satisfaction'].includes(marker.emotion);
                          const isNegative = marker.emotion && ['Sadness', 'Disgust', 'Boredom', 'Dissatisfaction'].includes(marker.emotion);
                          
                          return (
                            <div
                              key={idx}
                              style={{
                                position: 'absolute',
                                left: `${marker.x}%`,
                                top: `${marker.y}%`,
                                width: `${marker.width}%`,
                                height: `${marker.height}%`,
                                backgroundColor: isPositive 
                                  ? 'rgba(34, 197, 94, 0.2)' 
                                  : isNegative 
                                  ? 'rgba(239, 68, 68, 0.2)' 
                                  : 'rgba(59, 130, 246, 0.2)',
                                border: isPositive 
                                  ? '2px solid rgba(34, 197, 94, 0.5)' 
                                  : isNegative 
                                  ? '2px solid rgba(239, 68, 68, 0.5)' 
                                  : '2px solid rgba(59, 130, 246, 0.5)',
                                pointerEvents: 'none'
                              }}
                            />
                          );
                        } else if (areaViewLayer === 'needs') {
                          const needColor = marker.need === 'Autonomy' ? 'rgba(96, 165, 250, 0.2)' : 
                                          marker.need === 'Competence' ? 'rgba(74, 222, 128, 0.2)' : 
                                          'rgba(244, 114, 182, 0.2)';
                          const borderColor = marker.need === 'Autonomy' ? '2px solid rgba(96, 165, 250, 0.5)' : 
                                            marker.need === 'Competence' ? '2px solid rgba(74, 222, 128, 0.5)' : 
                                            '2px solid rgba(244, 114, 182, 0.5)';
                          
                          return (
                            <div
                              key={idx}
                              style={{
                                position: 'absolute',
                                left: `${marker.x}%`,
                                top: `${marker.y}%`,
                                width: `${marker.width}%`,
                                height: `${marker.height}%`,
                                backgroundColor: needColor,
                                border: borderColor,
                                pointerEvents: 'none'
                              }}
                            />
                          );
                        } else {
                          const strategyColor = marker.brief_type === 'Opportunity' ? 'rgba(34, 197, 94, 0.2)' : 
                                              marker.brief_type === 'Pain Point' ? 'rgba(239, 68, 68, 0.2)' : 
                                              'rgba(59, 130, 246, 0.2)';
                          const borderColor = marker.brief_type === 'Opportunity' ? '2px solid rgba(34, 197, 94, 0.5)' : 
                                            marker.brief_type === 'Pain Point' ? '2px solid rgba(239, 68, 68, 0.5)' : 
                                            '2px solid rgba(59, 130, 246, 0.5)';
                          
                          return (
                            <div
                              key={idx}
                              style={{
                                position: 'absolute',
                                left: `${marker.x}%`,
                                top: `${marker.y}%`,
                                width: `${marker.width}%`,
                                height: `${marker.height}%`,
                                backgroundColor: strategyColor,
                                border: borderColor,
                                pointerEvents: 'none'
                              }}
                            />
                          );
                        }
                      })
                    ) : (
                      filteredMarkers.filter(m => !m.isArea).map((marker, idx) => (
                        <div
                          key={idx}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2" 
                          style={{
                            left: `${marker.x}%`,
                            top: `${marker.y}%`
                          }}
                        >
                          {areaViewLayer === 'emotions' && marker.emotion && (
                            <EmotionToken emotion={marker.emotion} size="sm" />
                          )}
                          {areaViewLayer === 'needs' && marker.need && (
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md ${
                              marker.need === 'Autonomy' ? 'bg-blue-400' : 
                              marker.need === 'Competence' ? 'bg-green-400' : 
                              'bg-pink-400'
                            }`}>
                              {marker.need === 'Autonomy' ? <Users size={20} className="text-white" /> :
                               marker.need === 'Competence' ? <Brain size={20} className="text-white" /> :
                               <Heart size={20} className="text-white" />}
                            </div>
                          )}
                          {areaViewLayer === 'strategy' && marker.brief_type && (
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md ${
                              marker.brief_type === 'Opportunity' ? 'bg-green-500' : 
                              marker.brief_type === 'Pain Point' ? 'bg-red-500' : 
                              'bg-blue-500'
                            }`}>
                              {marker.brief_type === 'Opportunity' ? <Lightbulb size={20} className="text-white" /> :
                               marker.brief_type === 'Pain Point' ? <AlertTriangle size={20} className="text-white" /> :
                               <Brain size={20} className="text-white" />}
                            </div>
                          )}
                        </div>
                      ))
                       )}
                      </div>
                    </div>
                   </div>
                 </div>
                
                {/* Metrics Summary */}
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg text-sm">
                  <span className="text-gray-600">
                    Showing <strong>{filteredMarkers.length}</strong> {areaViewMode === 'heatmap' ? 'area' : 'point'}
                    {filteredMarkers.length !== 1 ? 's' : ''} for <strong>{areaViewLayer}</strong> layer
                    {areaViewSource !== 'all' && ` from ${areaViewSource === 'ai' ? 'AI' : 'Human'} sources`}
                  </span>
                  {areaViewMode === 'heatmap' && (
                    <div className="flex gap-3 text-xs">
                      {areaViewLayer === 'emotions' && (
                        <>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-green-500 bg-opacity-30 border border-green-500 rounded"></div>
                            <span>Positive</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-red-500 bg-opacity-30 border border-red-500 rounded"></div>
                            <span>Negative</span>
                          </div>
                        </>
                      )}
                      {areaViewLayer === 'needs' && (
                        <>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-blue-400 bg-opacity-30 border border-blue-400 rounded"></div>
                            <span>Autonomy</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-green-400 bg-opacity-30 border border-green-400 rounded"></div>
                            <span>Competence</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-pink-400 bg-opacity-30 border border-pink-400 rounded"></div>
                            <span>Relatedness</span>
                          </div>
                        </>
                      )}
                      {areaViewLayer === 'strategy' && (
                        <>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-green-500 bg-opacity-30 border border-green-500 rounded"></div>
                            <span>Opportunity</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-red-500 bg-opacity-30 border border-red-500 rounded"></div>
                            <span>Pain Point</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-blue-500 bg-opacity-30 border border-blue-500 rounded"></div>
                            <span>Insight</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>}

        {/* AI Highlighted Areas of Interest */}
        {project.screenshot && <Card className="mb-6 border-2 border-lem-orange pdf-no-break">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100">
              <CardTitle className="text-xl flex items-center gap-2">
                <Lightbulb className="text-lem-orange" size={24} />
                AI-Identified Areas of Interest
              </CardTitle>
              <p className="text-sm text-gray-600">In-depth analysis of key UX elements across emotions, needs, and strategy</p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Get top markers from each layer */}
                {(() => {
              const emotionMarkers = project.markers.filter(m => m.layer === 'emotions').slice(0, 2);
              const needsMarkers = project.markers.filter(m => m.layer === 'needs').slice(0, 2);
              const strategyMarkers = project.markers.filter(m => m.layer === 'strategy').slice(0, 2);
              const highlightedMarkers = [...emotionMarkers, ...needsMarkers, ...strategyMarkers];
              return highlightedMarkers.map((marker, idx) => {
                let layerColor = 'bg-orange-500';
                let layerIcon = <Heart size={16} />;
                let layerLabel = 'Emotional';
                if (marker.layer === 'needs') {
                  layerColor = 'bg-blue-500';
                  layerIcon = <Brain size={16} />;
                  layerLabel = 'Psychological Need';
                } else if (marker.layer === 'strategy') {
                  layerColor = 'bg-green-500';
                  layerIcon = <Lightbulb size={16} />;
                  layerLabel = 'Strategic';
                }
                return <div key={marker.id} className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 rounded-lg border-l-4 border-lem-orange">
                        <div className="md:w-32 flex-shrink-0 relative">
                          <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden shadow-md h-24 bg-white">
                            <div className="absolute inset-0" style={{
                        backgroundImage: `url(${project.screenshot})`,
                        backgroundSize: `${100 / 0.15}% auto`,
                        backgroundPosition: `${marker.x / 0.15}% ${marker.y / 0.15}%`
                      }} />
                            <div className="absolute w-2 h-2 bg-lem-orange rounded-full border border-white shadow-lg" style={{
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)'
                      }} />
                          </div>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2">
                            <div className={`${layerColor} text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1`}>
                              {layerIcon}
                              {layerLabel}
                            </div>
                            {marker.emotion && <div className="flex items-center gap-2">
                                <EmotionToken emotion={marker.emotion} size="sm" />
                                <span className="text-sm font-bold text-gray-700">
                                  {EMOTIONS[marker.emotion].label}
                                </span>
                              </div>}
                            {marker.need && <Badge variant="outline" className="text-xs">
                                {marker.need}
                              </Badge>}
                            {marker.brief_type && <Badge variant="outline" className="text-xs">
                                {marker.brief_type}
                              </Badge>}
                          </div>
                          <div className="bg-white p-4 rounded-md border border-gray-200">
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {marker.comment}
                            </p>
                          </div>
                          <div className="text-xs text-gray-500">
                            Position: {marker.x.toFixed(1)}% horizontal, {marker.y.toFixed(1)}% from top
                          </div>
                        </div>
                      </div>;
              });
            })()}
              </div>
            </CardContent>
          </Card>}

        {/* Emotion Breakdown */}
        <Card className="mb-6 pdf-no-break">
          <CardHeader>
            <CardTitle className="text-xl">Emotional Response Analysis</CardTitle>
            <p className="text-sm text-gray-500">Distribution of emotional reactions across all markers</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topEmotions.map(([emotion, count]) => {
              const percentage = count / allMarkers.length * 100;
              const emotionData = EMOTIONS[emotion as keyof typeof EMOTIONS];
              return <div key={emotion}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                        <EmotionToken emotion={emotion as any} size="sm" />
                        <div>
                          <span className="font-bold capitalize block">{emotionData?.label || emotion}</span>
                          <span className="text-xs text-gray-500">{emotionData?.description}</span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{count} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <Progress value={percentage} className="h-3" />
                  </div>;
            })}
            </div>
          </CardContent>
        </Card>

        {/* SDT Scores */}
        <Card className="mb-6 pdf-no-break">
          <CardHeader>
            <CardTitle className="text-xl">Self-Determination Theory Scores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-lg">Autonomy</h4>
                <span className="text-2xl font-black text-lem-orange">{project.report.sdtScores.autonomy.score}/10</span>
              </div>
              <Progress value={project.report.sdtScores.autonomy.score * 10} className="h-3 mb-2" />
              <p className="text-sm text-gray-600">{project.report.sdtScores.autonomy.justification}</p>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-lg">Competence</h4>
                <span className="text-2xl font-black text-lem-orange">{project.report.sdtScores.competence.score}/10</span>
              </div>
              <Progress value={project.report.sdtScores.competence.score * 10} className="h-3 mb-2" />
              <p className="text-sm text-gray-600">{project.report.sdtScores.competence.justification}</p>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-lg">Relatedness</h4>
                <span className="text-2xl font-black text-lem-orange">{project.report.sdtScores.relatedness.score}/10</span>
              </div>
              <Progress value={project.report.sdtScores.relatedness.score * 10} className="h-3 mb-2" />
              <p className="text-sm text-gray-600">{project.report.sdtScores.relatedness.justification}</p>
            </div>
          </CardContent>
        </Card>

        {/* Key Findings */}
        <Card className="mb-6 pdf-no-break">
          <CardHeader>
            <CardTitle className="text-xl">Key Findings & Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.report.keyFindings.map((finding, idx) => <div key={idx} className="border-l-4 border-lem-orange pl-4 py-2 pdf-no-break">
                <h4 className="font-bold text-lg text-gray-900 mb-1">{finding.title}</h4>
                <p className="text-gray-600">{finding.description}</p>
              </div>)}
          </CardContent>
        </Card>

        {/* Strategic Recommendations */}
        <Card className="mb-6 pdf-no-break">
          <CardHeader>
            <CardTitle className="text-xl">Strategic Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {project.report.suggestions.map((suggestion, idx) => <li key={idx} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                  <span className="flex-shrink-0 w-6 h-6 bg-lem-orange text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-gray-700">{suggestion}</span>
                </li>)}
            </ul>
          </CardContent>
        </Card>

        {/* Participant Insights & Analysis */}
        {sessions.length > 0 && <Card className="mb-6 pdf-no-break pdf-page-break-before">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
              <CardTitle className="text-xl flex items-center gap-2">
                <Users className="text-blue-600" size={24} />
                Participant Insights & Findings
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">Qualitative analysis from {sessions.length} participant {sessions.length === 1 ? 'session' : 'sessions'}</p>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Metrics Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg text-center">
                  <p className="text-3xl font-black">{sessions.length}</p>
                  <p className="text-xs uppercase tracking-wide mt-1">Participants</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-lg text-center">
                  <p className="text-3xl font-black">{sessions.reduce((sum, s) => sum + s.markers.length, 0)}</p>
                  <p className="text-xs uppercase tracking-wide mt-1">Human Markers</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg text-center">
                  <p className="text-3xl font-black">
                    {sessions.reduce((sum, s) => sum + s.markers.filter(m => m.emotion && EMOTIONS[m.emotion].category === 'Positive').length, 0)}
                  </p>
                  <p className="text-xs uppercase tracking-wide mt-1">Positive Reactions</p>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-4 rounded-lg text-center">
                  <p className="text-3xl font-black">
                    {sessions.reduce((sum, s) => sum + s.markers.filter(m => m.emotion && EMOTIONS[m.emotion].category === 'Negative').length, 0)}
                  </p>
                  <p className="text-xs uppercase tracking-wide mt-1">Negative Reactions</p>
                </div>
              </div>

              {/* Participant Emotion Analysis */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-bold text-lg mb-3 text-gray-900">Emotional Response Patterns</h4>
                {(() => {
              const participantEmotions = sessions.flatMap(s => s.markers).filter(m => m.emotion);
              const emotionCounts = participantEmotions.reduce((acc, m) => {
                if (m.emotion) acc[m.emotion] = (acc[m.emotion] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);
              const topParticipantEmotions = Object.entries(emotionCounts).sort(([, a], [, b]) => b - a).slice(0, 3);
              return topParticipantEmotions.length > 0 ? <div className="space-y-3">
                      {topParticipantEmotions.map(([emotion, count]) => {
                  const emotionData = EMOTIONS[emotion as keyof typeof EMOTIONS];
                  const percentage = count / participantEmotions.length * 100;
                  return <div key={emotion} className="flex items-center gap-3">
                            <EmotionToken emotion={emotion as any} size="sm" />
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-sm">{emotionData.label}</span>
                                <span className="text-xs text-gray-600">{count} mentions ({percentage.toFixed(0)}%)</span>
                              </div>
                              <Progress value={percentage} className="h-2" />
                            </div>
                          </div>;
                })}
                    </div> : <p className="text-sm text-gray-500">No emotional markers from participants yet</p>;
            })()}
              </div>

              {/* Key Participant Quotes & Comments */}
              <div className="mb-6">
                <h4 className="font-bold text-lg mb-3 text-gray-900">Notable Participant Comments</h4>
                <div className="space-y-3">
                  {sessions.flatMap(s => s.markers.filter(m => m.comment && m.comment.length > 20).map(m => ({
                ...m,
                participantName: s.participant_name,
                sessionDate: s.created_at
              }))).slice(0, 6).map((marker, idx) => <div key={idx} className="bg-white border-l-4 border-blue-500 p-4 rounded-r-lg shadow-sm">
                      <div className="flex items-start gap-3">
                        {marker.emotion && <EmotionToken emotion={marker.emotion} size="sm" />}
                        <div className="flex-1">
                          <p className="text-sm text-gray-700 italic mb-2">&ldquo;{marker.comment}&rdquo;</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="font-semibold">{marker.participantName}</span>
                            <span>•</span>
                            <span>{new Date(marker.sessionDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>)}
                </div>
              </div>

              {/* Conclusions & Insights */}
              <div className="bg-gradient-to-br from-lem-orange to-orange-600 text-white p-6 rounded-lg">
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Lightbulb size={20} />
                  Key Conclusions from Participant Testing
                </h4>
                <div className="space-y-3 text-sm">
                  {(() => {
                const participantMarkers = sessions.flatMap(s => s.markers);
                const positiveCount = participantMarkers.filter(m => m.emotion && EMOTIONS[m.emotion].category === 'Positive').length;
                const negativeCount = participantMarkers.filter(m => m.emotion && EMOTIONS[m.emotion].category === 'Negative').length;
                const totalCount = participantMarkers.filter(m => m.emotion).length;
                const positiveRatio = totalCount > 0 ? positiveCount / totalCount * 100 : 0;
                const needsMarkers = participantMarkers.filter(m => m.layer === 'needs');
                const strategyMarkers = participantMarkers.filter(m => m.layer === 'strategy');
                return <>
                        <div className="bg-white/10 backdrop-blur-sm p-3 rounded">
                          <p className="font-semibold mb-1">Overall Sentiment:</p>
                          <p>
                            {positiveRatio >= 60 ? `Participants responded overwhelmingly positive (${positiveRatio.toFixed(0)}% positive reactions), indicating strong emotional resonance with the design.` : positiveRatio >= 40 ? `Participants showed mixed emotional responses (${positiveRatio.toFixed(0)}% positive), suggesting room for optimization in user experience.` : `Participants expressed concerns (${(100 - positiveRatio).toFixed(0)}% negative/neutral reactions), highlighting critical areas requiring attention.`}
                          </p>
                        </div>
                        
                        <div className="bg-white/10 backdrop-blur-sm p-3 rounded">
                          <p className="font-semibold mb-1">Psychological Needs:</p>
                          <p>
                            {needsMarkers.length > 0 ? `Participants identified ${needsMarkers.length} areas related to psychological needs, emphasizing the importance of ${needsMarkers[0]?.need || 'user empowerment'} in the design.` : `Participants focused primarily on emotional responses rather than deeper psychological needs, suggesting intuitive usability.`}
                          </p>
                        </div>
                        
                        <div className="bg-white/10 backdrop-blur-sm p-3 rounded">
                          <p className="font-semibold mb-1">Strategic Opportunities:</p>
                          <p>
                            {strategyMarkers.length > 0 ? `Participants highlighted ${strategyMarkers.length} strategic areas, providing valuable insights for ${strategyMarkers.filter(m => m.brief_type === 'Opportunity').length > 0 ? 'enhancement opportunities' : 'addressing pain points'}.` : `Most participant feedback focused on immediate emotional reactions, suggesting strong first impressions but potential for deeper engagement analysis.`}
                          </p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm p-3 rounded">
                          <p className="font-semibold mb-1">Consensus vs. Divergence:</p>
                          <p>
                            {sessions.length > 1 ? `With ${sessions.length} participants, ${positiveRatio >= 70 || positiveRatio <= 30 ? 'there is strong consensus' : 'opinions are diverse'}, ${positiveRatio >= 70 || positiveRatio <= 30 ? 'indicating clear UX patterns' : 'suggesting varied user perspectives worth exploring'}.` : `Single participant provides initial insights; additional testing recommended for broader validation.`}
                          </p>
                        </div>
                      </>;
              })()}
                </div>
              </div>

              {/* Individual Session Details */}
              <div className="mt-6">
                <h4 className="font-bold text-lg mb-3 text-gray-900">Individual Participant Sessions</h4>
                <div className="space-y-3">
                  {sessions.map(session => <div key={session.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-gray-900">{session.participant_name}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(session.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-white p-2 rounded">
                          <p className="font-bold text-lg">{session.markers.length}</p>
                          <p className="text-gray-600">Total Markers</p>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <p className="font-bold text-lg text-green-600">
                            {session.markers.filter(m => m.emotion && EMOTIONS[m.emotion].category === 'Positive').length}
                          </p>
                          <p className="text-gray-600">Positive</p>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <p className="font-bold text-lg text-red-600">
                            {session.markers.filter(m => m.emotion && EMOTIONS[m.emotion].category === 'Negative').length}
                          </p>
                          <p className="text-gray-600">Negative</p>
                        </div>
                      </div>
                    </div>)}
                </div>
              </div>
            </CardContent>
          </Card>}

        {/* Footer */}
        <div className="mt-8 p-6 bg-gray-900 text-white rounded-lg text-center">
          <p className="text-sm mb-2">Generated by LEMtool METHOD</p>
          <p className="text-xs text-gray-400">Emotional UX Analysis Platform • www.metodic.io</p>
        </div>
      </div>
    </div>;
};
export default FullReportView;