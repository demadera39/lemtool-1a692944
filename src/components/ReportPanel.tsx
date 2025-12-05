import { AnalysisReport, Marker, LayerType } from '../types';
import { Award, Users, Target, Lightbulb, TrendingUp, Brain, Lock, Map, Grid3x3, MapPin, Heart, AlertTriangle, Sparkles, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useState } from 'react';
import EmotionToken from './EmotionToken';

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
  const [areaViewLayer, setAreaViewLayer] = useState<LayerType>('emotions');
  const [areaViewSource, setAreaViewSource] = useState<'all' | 'ai' | 'human'>('all');
  const [areaViewMode, setAreaViewMode] = useState<'heatmap' | 'points'>('heatmap');
  
  const sessions = Array.from(new Set(markers.filter(m => m.sessionId).map(m => m.sessionId)));
  
  const getFilteredAreas = () => {
    let filtered = areaMarkers.filter(m => m.layer === areaViewLayer);
    if (areaViewSource === 'ai') filtered = filtered.filter(m => m.source === 'AI');
    else if (areaViewSource === 'human') filtered = filtered.filter(m => m.source === 'HUMAN');
    if (selectedSession !== 'all') {
      if (selectedSession === 'ai') filtered = filtered.filter(m => m.source === 'AI');
      else filtered = filtered.filter(m => m.sessionId === selectedSession);
    }
    return filtered;
  };
  
  const getFilteredPoints = () => {
    let filtered = markers.filter(m => !m.isArea && m.layer === areaViewLayer);
    if (areaViewSource === 'ai') filtered = filtered.filter(m => m.source === 'AI');
    else if (areaViewSource === 'human') filtered = filtered.filter(m => m.source === 'HUMAN');
    if (selectedSession !== 'all') {
      if (selectedSession === 'ai') filtered = filtered.filter(m => m.source === 'AI');
      else filtered = filtered.filter(m => m.sessionId === selectedSession);
    }
    return filtered;
  };
  
  const filteredAreas = getFilteredAreas();
  const filteredPoints = getFilteredPoints();

  if (isAnalyzing) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-card">
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" size={24} />
        </div>
        <p className="font-bold text-lg text-foreground">Analyzing website...</p>
        <p className="text-sm mt-1 text-muted-foreground">This may take a few moments</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-card">
      <div className="p-5 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="text-primary" size={20} />
          <h2 className="text-xl font-bold text-foreground">Analysis Report</h2>
        </div>
        {currentUrl && (
          <p className="text-xs text-muted-foreground truncate mb-4 bg-muted px-3 py-1.5 rounded-lg">{currentUrl}</p>
        )}
        
        {report && (
          <div className="bg-gradient-to-br from-foreground to-foreground/90 text-background rounded-2xl p-5 mb-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-xs text-background/60 uppercase tracking-wider mb-1">UX Emotion Score</p>
                  <p className="text-5xl font-black">{report.overallScore}<span className="text-2xl text-background/60">/100</span></p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-primary">{emotionMarkers.length + needsMarkers.length + strategyMarkers.length}</p>
                  <p className="text-xs text-background/60 uppercase">Total Insights</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl overflow-x-auto">
          <button
            onClick={() => {
              setActiveLayer('emotions');
              setShowAreaView(false);
            }}
            className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeLayer === 'emotions' && !showAreaView
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Emotions
          </button>
          <button
            onClick={() => {
              setActiveLayer('needs');
              setShowAreaView(false);
            }}
            className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeLayer === 'needs' && !showAreaView
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Psych Needs
          </button>
          <button
            onClick={() => {
              setActiveLayer('strategy');
              setShowAreaView(false);
            }}
            className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeLayer === 'strategy' && !showAreaView
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Strategy
          </button>
          <button
            onClick={() => setShowAreaView(true)}
            className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
              showAreaView
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Area View
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
        {!report ? (
          <div className="text-center text-muted-foreground py-12">
            <Brain size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium text-foreground">No analysis yet</p>
            <p className="text-sm mt-1">Enter a URL and click Analyze</p>
          </div>
        ) : (
          <>
            <Card className="border-border bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="text-primary" size={18} />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{report.summary}</p>
              </CardContent>
            </Card>

            {activeLayer === 'emotions' && !showAreaView && (
              <>
                <Card className="border-border bg-card/50">
                  <CardHeader className="pb-2">
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
            
            {showAreaView && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Map className="text-lem-orange" size={18} />
                    Visual Analysis Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {areaMarkers.length === 0 && filteredPoints.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="font-medium mb-2">No area selections yet</p>
                      <p className="text-sm">Participants can draw areas to highlight specific regions of interest</p>
                    </div>
                  ) : (
                    <>
                      {/* Layer Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Analysis Layer:</label>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={areaViewLayer === 'emotions' ? 'default' : 'outline'}
                        onClick={() => setAreaViewLayer('emotions')}
                        className={areaViewLayer === 'emotions' ? 'bg-lem-orange hover:bg-lem-orange-dark' : ''}
                      >
                        Emotions
                      </Button>
                      <Button
                        size="sm"
                        variant={areaViewLayer === 'needs' ? 'default' : 'outline'}
                        onClick={() => setAreaViewLayer('needs')}
                        className={areaViewLayer === 'needs' ? 'bg-lem-orange hover:bg-lem-orange-dark' : ''}
                      >
                        Needs
                      </Button>
                      <Button
                        size="sm"
                        variant={areaViewLayer === 'strategy' ? 'default' : 'outline'}
                        onClick={() => setAreaViewLayer('strategy')}
                        className={areaViewLayer === 'strategy' ? 'bg-lem-orange hover:bg-lem-orange-dark' : ''}
                      >
                        Strategy
                      </Button>
                    </div>
                  </div>

                  {/* Source Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Source:</label>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={areaViewSource === 'all' ? 'default' : 'outline'}
                        onClick={() => setAreaViewSource('all')}
                        className={areaViewSource === 'all' ? 'bg-lem-orange hover:bg-lem-orange-dark' : ''}
                      >
                        All
                      </Button>
                      <Button
                        size="sm"
                        variant={areaViewSource === 'ai' ? 'default' : 'outline'}
                        onClick={() => setAreaViewSource('ai')}
                        className={areaViewSource === 'ai' ? 'bg-lem-orange hover:bg-lem-orange-dark' : ''}
                      >
                        AI
                      </Button>
                      <Button
                        size="sm"
                        variant={areaViewSource === 'human' ? 'default' : 'outline'}
                        onClick={() => setAreaViewSource('human')}
                        className={areaViewSource === 'human' ? 'bg-lem-orange hover:bg-lem-orange-dark' : ''}
                      >
                        Humans
                      </Button>
                    </div>
                  </div>

                  {/* View Mode Toggle */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">View Mode:</label>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={areaViewMode === 'heatmap' ? 'default' : 'outline'}
                        onClick={() => setAreaViewMode('heatmap')}
                        className={areaViewMode === 'heatmap' ? 'bg-lem-orange hover:bg-lem-orange-dark' : ''}
                      >
                        <Grid3x3 size={16} className="mr-1" />
                        Areas
                      </Button>
                      <Button
                        size="sm"
                        variant={areaViewMode === 'points' ? 'default' : 'outline'}
                        onClick={() => setAreaViewMode('points')}
                        className={areaViewMode === 'points' ? 'bg-lem-orange hover:bg-lem-orange-dark' : ''}
                      >
                        <MapPin size={16} className="mr-1" />
                        Points
                      </Button>
                    </div>
                  </div>

                  {/* Participant Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Participant:</label>
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
                    <div className="relative w-full border border-gray-200 rounded-lg overflow-hidden bg-gray-100">
                      <img src={screenshot} alt="Screenshot" className="w-full" />
                      <div className="absolute inset-0">
                        {areaViewMode === 'heatmap' ? (
                          filteredAreas.map((marker, idx) => {
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
                          filteredPoints.map((marker, idx) => (
                            <div
                              key={idx}
                              style={{
                                position: 'absolute',
                                left: `${marker.x}%`,
                                top: `${marker.y}%`,
                                transform: 'translate(-50%, -50%)',
                                pointerEvents: 'none'
                              }}
                            >
                              {areaViewLayer === 'emotions' && marker.emotion && (
                                <EmotionToken emotion={marker.emotion} size="sm" />
                              )}
                              {areaViewLayer === 'needs' && marker.need && (
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
                                  marker.need === 'Autonomy' ? 'bg-blue-400' : 
                                  marker.need === 'Competence' ? 'bg-green-400' : 
                                  'bg-pink-400'
                                }`}>
                                  {marker.need === 'Autonomy' ? <Users size={16} className="text-white" /> :
                                   marker.need === 'Competence' ? <Brain size={16} className="text-white" /> :
                                   <Heart size={16} className="text-white" />}
                                </div>
                              )}
                              {areaViewLayer === 'strategy' && marker.brief_type && (
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
                                  marker.brief_type === 'Opportunity' ? 'bg-green-500' : 
                                  marker.brief_type === 'Pain Point' ? 'bg-red-500' : 
                                  'bg-blue-500'
                                }`}>
                                  {marker.brief_type === 'Opportunity' ? <Lightbulb size={16} className="text-white" /> :
                                   marker.brief_type === 'Pain Point' ? <AlertTriangle size={16} className="text-white" /> :
                                   <Brain size={16} className="text-white" />}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>
                      Showing {areaViewMode === 'heatmap' ? filteredAreas.length : filteredPoints.length} {areaViewMode === 'heatmap' ? 'area' : 'point'}
                      {(areaViewMode === 'heatmap' ? filteredAreas.length : filteredPoints.length) !== 1 ? 's' : ''} 
                      {' '}for <strong>{areaViewLayer}</strong> layer
                      {areaViewSource !== 'all' && ` from ${areaViewSource === 'ai' ? 'AI' : 'Human'} sources`}
                    </p>
                    {areaViewMode === 'heatmap' && (
                      <div className="flex gap-4 text-xs pt-2 flex-wrap">
                        {areaViewLayer === 'emotions' && (
                          <>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-green-500 bg-opacity-30 border-2 border-green-500 border-opacity-50 rounded"></div>
                              <span>Positive</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-red-500 bg-opacity-30 border-2 border-red-500 border-opacity-50 rounded"></div>
                              <span>Negative</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-blue-500 bg-opacity-30 border-2 border-blue-500 border-opacity-50 rounded"></div>
                              <span>Neutral</span>
                            </div>
                          </>
                        )}
                        {areaViewLayer === 'needs' && (
                          <>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-blue-400 bg-opacity-30 border-2 border-blue-400 border-opacity-50 rounded"></div>
                              <span>Autonomy</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-green-400 bg-opacity-30 border-2 border-green-400 border-opacity-50 rounded"></div>
                              <span>Competence</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-pink-400 bg-opacity-30 border-2 border-pink-400 border-opacity-50 rounded"></div>
                              <span>Relatedness</span>
                            </div>
                          </>
                        )}
                        {areaViewLayer === 'strategy' && (
                          <>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-green-500 bg-opacity-30 border-2 border-green-500 border-opacity-50 rounded"></div>
                              <span>Opportunity</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-red-500 bg-opacity-30 border-2 border-red-500 border-opacity-50 rounded"></div>
                              <span>Pain Point</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-blue-500 bg-opacity-30 border-2 border-blue-500 border-opacity-50 rounded"></div>
                              <span>Insight</span>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                    </>
                  )}
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
