import { AnalysisReport, Marker, LayerType } from '../types';
import { Users, Target, Lightbulb, TrendingUp, Brain, Map, Heart, Sparkles, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { useState } from 'react';

interface ReportPanelProps {
  report: AnalysisReport | null;
  markers: Marker[];
  isAnalyzing: boolean;
  currentUrl: string;
  activeLayer: LayerType;
  setActiveLayer: (layer: LayerType) => void;
  screenshot?: string;
  onScrollToMarker?: (markerId: string, yPercent: number) => void;
}

const ReportPanel = ({ report, markers, isAnalyzing, currentUrl, activeLayer, setActiveLayer, screenshot, onScrollToMarker }: ReportPanelProps) => {
  const emotionMarkers = markers.filter(m => m.layer === 'emotions');
  const needsMarkers = markers.filter(m => m.layer === 'needs');
  const strategyMarkers = markers.filter(m => m.layer === 'strategy');
  
  const [showAreaView, setShowAreaView] = useState(false);

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

        <div className="grid grid-cols-4 gap-1 bg-muted/50 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveLayer('emotions');
              setShowAreaView(false);
            }}
            className={`px-2 py-2 text-xs font-semibold rounded-lg transition-all text-center ${
              activeLayer === 'emotions' && !showAreaView
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Emotions
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveLayer('needs');
              setShowAreaView(false);
            }}
            className={`px-2 py-2 text-xs font-semibold rounded-lg transition-all text-center ${
              activeLayer === 'needs' && !showAreaView
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Needs
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveLayer('strategy');
              setShowAreaView(false);
            }}
            className={`px-2 py-2 text-xs font-semibold rounded-lg transition-all text-center ${
              activeLayer === 'strategy' && !showAreaView
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Strategy
          </button>
          <button
            type="button"
            onClick={() => {
              console.log('Areas tab clicked, setting showAreaView to true');
              setShowAreaView(true);
            }}
            className={`px-2 py-2 text-xs font-semibold rounded-lg transition-all text-center ${
              showAreaView
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Areas
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

                {/* Personas Section */}
                {report.personas && report.personas.length > 0 && (
                  <Card className="border-border bg-card/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="text-primary" size={18} />
                        Target Personas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {report.personas.map((persona, idx) => (
                        <div key={idx} className="border border-border rounded-lg p-3 bg-muted/30">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-bold text-sm text-foreground">{persona.name}</h4>
                              <p className="text-xs text-muted-foreground">{persona.role}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {persona.techLiteracy} Tech
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2 italic">"{persona.quote}"</p>
                          <p className="text-xs text-muted-foreground">{persona.goals}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
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
              <Card className="border-border bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Map className="text-primary" size={18} />
                    Areas of Interest
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Click to navigate to marker location</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {markers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="font-medium mb-2">No markers yet</p>
                      <p className="text-sm">Run an analysis to see areas of interest</p>
                    </div>
                  ) : (
                    <>
                      {/* Get top markers from each layer */}
                      {(() => {
                        const topEmotionMarkers = markers.filter(m => m.layer === 'emotions').slice(0, 3);
                        const topNeedsMarkers = markers.filter(m => m.layer === 'needs').slice(0, 3);
                        const topStrategyMarkers = markers.filter(m => m.layer === 'strategy').slice(0, 3);
                        const highlightedMarkers = [...topEmotionMarkers, ...topNeedsMarkers, ...topStrategyMarkers];
                        
                        return highlightedMarkers.map((marker) => {
                          let layerColor = 'bg-primary';
                          let layerIcon = <Heart size={14} className="text-white" />;
                          let layerLabel = 'Emotion';
                          let typeLabel = marker.emotion || '';
                          
                          if (marker.layer === 'needs') {
                            layerColor = 'bg-blue-500';
                            layerIcon = <Brain size={14} className="text-white" />;
                            layerLabel = 'Need';
                            typeLabel = marker.need || '';
                          } else if (marker.layer === 'strategy') {
                            layerColor = 'bg-green-500';
                            layerIcon = <Lightbulb size={14} className="text-white" />;
                            layerLabel = 'Strategy';
                            typeLabel = marker.brief_type || '';
                          }
                          
                          return (
                            <button
                              key={marker.id}
                              onClick={() => {
                                // Switch layer in the canvas but stay on Areas tab
                                setActiveLayer(marker.layer);
                                // Scroll to the marker in the canvas
                                onScrollToMarker?.(marker.id, marker.y);
                              }}
                              className="w-full text-left p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors group"
                            >
                              <div className="flex items-start gap-3">
                                {/* Layer badge */}
                                <div className={`${layerColor} p-1.5 rounded-full flex-shrink-0`}>
                                  {layerIcon}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="text-xs">
                                      {layerLabel}
                                    </Badge>
                                    {typeLabel && (
                                      <span className="text-xs font-medium text-foreground">{typeLabel}</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {marker.comment}
                                  </p>
                                  <p className="text-xs text-muted-foreground/60 mt-1">
                                    {marker.y.toFixed(0)}% from top
                                  </p>
                                </div>
                                
                                <Zap size={14} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                              </div>
                            </button>
                          );
                        });
                      })()}
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
