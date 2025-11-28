import { useState } from 'react';
import { Project, TestSession } from '@/types';
import { Button } from './ui/button';
import { ArrowLeft, Download, Share2, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { EMOTIONS } from '@/constants';
import EmotionToken from './EmotionToken';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface FullReportViewProps {
  project: Project;
  sessions: TestSession[];
  onBack: () => void;
  onCopyParticipantLink: () => void;
}

const FullReportView = ({ project, sessions, onBack, onCopyParticipantLink }: FullReportViewProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async () => {
    setIsExporting(true);
    toast.info('Generating PDF...', { description: 'This may take a moment' });

    try {
      const reportElement = document.getElementById('full-report-content');
      if (!reportElement) return;

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add subsequent pages
      while (heightLeft > 0) {
        position -= pdfHeight; // Move position up by one page height
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

  const allMarkers = [...project.markers, ...sessions.flatMap(s => s.markers)];
  const emotionCounts = allMarkers.reduce((acc, m) => {
    if (m.emotion) {
      acc[m.emotion] = (acc[m.emotion] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topEmotions = Object.entries(emotionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
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
            <Button
              onClick={exportToPDF}
              disabled={isExporting}
              className="bg-lem-orange hover:bg-lem-orange-dark"
            >
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
          <CardContent className="p-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 10C27.9086 10 10 27.9086 10 50C10 72.0914 27.9086 90 50 90C72.0914 90 90 72.0914 90 50" stroke="white" strokeWidth="12" strokeLinecap="round"/>
                    <path d="M50 25C36.1929 25 25 36.1929 25 50C25 63.8071 36.1929 75 50 75C63.8071 75 75 63.8071 75 50" stroke="white" strokeWidth="10" strokeLinecap="round" opacity="0.6"/>
                  </svg>
                  <h2 className="text-3xl font-black">LEMtool METHOD</h2>
                </div>
                <p className="text-white/90 text-sm mb-4">Target: {project.url}</p>
                <p className="text-white/80 text-xs">
                  Generated: {new Date(project.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
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
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">{project.report.summary}</p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Participant Data */}
          <Card>
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
          <Card>
            <CardHeader>
              <CardTitle>Detected Brand Values</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {project.report.keyFindings.slice(0, 3).map((finding, idx) => (
                  <Badge key={idx} variant="outline" className="w-full justify-start text-left py-2">
                    {finding.title}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visual Overview with Markers */}
        {project.screenshot && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">Visual Analysis Overview</CardTitle>
              <p className="text-sm text-gray-500">Complete page with emotional markers and legend</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Legend */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg">
                  {Object.values(EMOTIONS).map((emotion) => (
                    <div key={emotion.id} className="flex items-center gap-2">
                      <EmotionToken emotion={emotion.id} size="sm" />
                      <span className="text-xs font-medium text-gray-700">{emotion.label}</span>
                    </div>
                  ))}
                </div>
                
                {/* Screenshot with Markers */}
                <div className="relative border border-gray-200 rounded-lg overflow-hidden">
                  <img src={project.screenshot} alt="Analysis overview" className="w-full h-auto" />
                  <div className="absolute inset-0">
                    {allMarkers.filter(m => m.layer === 'emotions' && m.emotion).map((marker) => (
                      <div
                        key={marker.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 opacity-90"
                        style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                      >
                        <EmotionToken 
                          emotion={marker.emotion!} 
                          size="sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Metrics Summary */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-lg">
                  <div className="text-center">
                    <p className="text-3xl font-black text-lem-orange">{allMarkers.length}</p>
                    <p className="text-xs text-gray-400 uppercase mt-1">Total Markers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black text-lem-orange">{project.markers.length}</p>
                    <p className="text-xs text-gray-400 uppercase mt-1">AI Analysis</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black text-lem-orange">{sessions.reduce((sum, s) => sum + s.markers.length, 0)}</p>
                    <p className="text-xs text-gray-400 uppercase mt-1">Human Input</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Emotion Breakdown */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">Emotional Response Analysis</CardTitle>
            <p className="text-sm text-gray-500">Distribution of emotional reactions across all markers</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topEmotions.map(([emotion, count]) => {
                const percentage = (count / allMarkers.length) * 100;
                const emotionData = EMOTIONS[emotion as keyof typeof EMOTIONS];
                return (
                  <div key={emotion}>
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
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* SDT Scores */}
        <Card className="mb-6">
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
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">Key Findings & Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.report.keyFindings.map((finding, idx) => (
              <div key={idx} className="border-l-4 border-lem-orange pl-4 py-2">
                <h4 className="font-bold text-lg text-gray-900 mb-1">{finding.title}</h4>
                <p className="text-gray-600">{finding.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Strategic Recommendations */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">Strategic Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {project.report.suggestions.map((suggestion, idx) => (
                <li key={idx} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                  <span className="flex-shrink-0 w-6 h-6 bg-lem-orange text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-gray-700">{suggestion}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Participant Sessions */}
        {sessions.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">Participant Feedback Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sessions.map((session, idx) => (
                  <div key={session.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-900">{session.participant_name}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(session.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {session.markers.length} emotional markers provided
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-8 p-6 bg-gray-900 text-white rounded-lg text-center">
          <p className="text-sm mb-2">Generated by LEMtool METHOD</p>
          <p className="text-xs text-gray-400">Emotional UX Analysis Platform • www.metodic.io</p>
        </div>
      </div>
    </div>
  );
};

export default FullReportView;
