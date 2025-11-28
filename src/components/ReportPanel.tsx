import { AnalysisReport, Marker, LayerType } from '../types';
import { Award, Users, Target, Lightbulb, TrendingUp, Brain, Lock, Map } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useState } from 'react';

interface ReportPanelProps {
  report: AnalysisReport | null;
  markers: Marker[];
  isAnalyzing: boolean;
  currentUrl: string;
  activeLayer: LayerType;
  setActiveLayer: (layer: LayerType) => void;
  screenshot?: string;
}

const ReportPanel = ({ report, markers, isAnalyzing, currentUrl, activeLayer, setActiveLayer, screenshot }: ReportPanelProps) => {
  const emotionMarkers = markers.filter(m => m.layer === 'emotions');
  const needsMarkers = markers.filter(m => m.layer === 'needs');
  const strategyMarkers = markers.filter(m => m.layer === 'strategy');
  const areaMarkers = markers.filter(m => m.isArea);
  
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [showAreaView, setShowAreaView] = useState(false);
  
  // Get unique sessions from markers
  const sessions = Array.from(new Set(markers.filter(m => m.sessionId).map(m => m.sessionId)));
  
  const getFilteredAreas = () => {
    if (selectedSession === 'all') return areaMarkers;
    if (selectedSession === 'ai') return areaMarkers.filter(m => m.source === 'AI');
    return areaMarkers.filter(m => m.sessionId === selectedSession);
  };
  
  const filteredAreas = getFilteredAreas();

  if (isAnalyzing) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-500">
        <div className="w-16 h-16 border-4 border-lem-orange border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-lg">Analyzing website...</p>
        <p className="text-sm mt-1">This may take a few moments</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-2xl font-black text-gray-900 mb-4">Summary</h2>
        {currentUrl && (
          <p className="text-xs text-gray-500 truncate mb-4">{currentUrl}</p>
        )}
        
        {report && (
          <div className="bg-gray-900 text-white rounded-lg p-6 mb-4">
            <div className="flex items-end justify-between mb-2">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">UX Emotion Score</p>
                <p className="text-5xl font-black">{report.overallScore}/100</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-lem-orange">{emotionMarkers.length + needsMarkers.length + strategyMarkers.length}</p>
                <p className="text-xs text-gray-400 uppercase">Total Insights</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => {
              setActiveLayer('emotions');
              setShowAreaView(false);
            }}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${
              activeLayer === 'emotions' && !showAreaView
                ? 'text-lem-orange border-b-2 border-lem-orange'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Emotions
          </button>
          <button
            onClick={() => {
              setActiveLayer('needs');
              setShowAreaView(false);
            }}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${
              activeLayer === 'needs' && !showAreaView
                ? 'text-lem-orange border-b-2 border-lem-orange'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Psych Needs
          </button>
          <button
            onClick={() => {
              setActiveLayer('strategy');
              setShowAreaView(false);
            }}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${
              activeLayer === 'strategy' && !showAreaView
                ? 'text-lem-orange border-b-2 border-lem-orange'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Strategy
          </button>
          {areaMarkers.length > 0 && (
            <button
              onClick={() => setShowAreaView(true)}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${
                showAreaView
                  ? 'text-lem-orange border-b-2 border-lem-orange'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Area View
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {!report ? (
          <div className="text-center text-gray-500 py-12">
            <Brain size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">No analysis yet</p>
            <p className="text-sm mt-1">Enter a URL and click Analyze</p>
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="text-lem-orange" size={18} />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{report.summary}</p>
              </CardContent>
            </Card>

            {activeLayer === 'emotions' && !showAreaView && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users className="text-lem-orange" size={18} />
                      Target Audience
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 mb-3">
                      {report.targetAudience}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Brain className="text-lem-orange" size={18} />
                      SDT Scores
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">Autonomy</span>
                        <span className="text-lem-orange font-bold">{report.sdtScores.autonomy.score}/10</span>
                      </div>
                      <Progress value={report.sdtScores.autonomy.score * 10} className="mb-1 h-2" />
                      <p className="text-xs text-gray-500">{report.sdtScores.autonomy.justification}</p>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">Competence</span>
                        <span className="text-lem-orange font-bold">{report.sdtScores.competence.score}/10</span>
                      </div>
                      <Progress value={report.sdtScores.competence.score * 10} className="mb-1 h-2" />
                      <p className="text-xs text-gray-500">{report.sdtScores.competence.justification}</p>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">Relatedness</span>
                        <span className="text-lem-orange font-bold">{report.sdtScores.relatedness.score}/10</span>
                      </div>
                      <Progress value={report.sdtScores.relatedness.score * 10} className="mb-1 h-2" />
                      <p className="text-xs text-gray-500">{report.sdtScores.relatedness.justification}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Target className="text-lem-orange" size={18} />
                      Key Findings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {report.keyFindings.map((finding, idx) => (
                      <div key={idx} className="border-l-2 border-lem-orange pl-3 py-1">
                        <h4 className="font-bold text-sm text-gray-900">{finding.title}</h4>
                        <p className="text-xs text-gray-600">{finding.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Lightbulb className="text-lem-orange" size={18} />
                      Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {report.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <TrendingUp size={14} className="text-lem-orange mt-0.5 flex-shrink-0" />
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </>
            )}

            {activeLayer === 'needs' && needsMarkers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Brain className="text-lem-orange" size={18} />
                    Psychological Needs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    Analysis of how the interface supports user autonomy, competence, and relatedness.
                  </p>
                  <div className="space-y-2">
                    {needsMarkers.map((marker, idx) => (
                      <div key={idx} className="border-l-2 border-blue-500 pl-3 py-1">
                        <h4 className="font-bold text-sm text-gray-900">{marker.need}</h4>
                        <p className="text-xs text-gray-600">{marker.comment}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeLayer === 'strategy' && strategyMarkers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="text-lem-orange" size={18} />
                    Strategic Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    Key opportunities and pain points identified in the user experience.
                  </p>
                  <div className="space-y-2">
                    {strategyMarkers.map((marker, idx) => (
                      <div key={idx} className="border-l-2 border-green-500 pl-3 py-1">
                        <h4 className="font-bold text-sm text-gray-900">{marker.brief_type}</h4>
                        <p className="text-xs text-gray-600">{marker.comment}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {showAreaView && areaMarkers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Map className="text-lem-orange" size={18} />
                    Area Heatmap
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <label className="text-sm font-medium mb-2 block">Filter by participant:</label>
                    <Select value={selectedSession} onValueChange={setSelectedSession}>
                      <SelectTrigger>
                        <SelectValue placeholder="All participants" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All participants</SelectItem>
                        <SelectItem value="ai">AI only</SelectItem>
                        {sessions.map((sessionId) => (
                          <SelectItem key={sessionId} value={sessionId!}>
                            Session {sessionId?.slice(-6)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {screenshot && (
                    <div className="relative w-full border border-gray-200 rounded-lg overflow-hidden">
                      <img src={screenshot} alt="Screenshot" className="w-full" />
                      <div className="absolute inset-0">
                        {filteredAreas.map((marker, idx) => {
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
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-600">
                      Showing {filteredAreas.length} area{filteredAreas.length !== 1 ? 's' : ''} 
                      {selectedSession !== 'all' && ` for ${selectedSession === 'ai' ? 'AI' : `Session ${selectedSession.slice(-6)}`}`}
                    </p>
                    <div className="flex gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 bg-opacity-30 border-2 border-green-500 border-opacity-50 rounded"></div>
                        <span>Positive emotions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 bg-opacity-30 border-2 border-red-500 border-opacity-50 rounded"></div>
                        <span>Negative emotions</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReportPanel;
