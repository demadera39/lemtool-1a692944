import { AnalysisReport, Marker, LayerType } from '../types';
import { Award, Users, Target, Lightbulb, TrendingUp, Brain, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface ReportPanelProps {
  report: AnalysisReport | null;
  markers: Marker[];
  isAnalyzing: boolean;
  currentUrl: string;
  activeLayer: LayerType;
  setActiveLayer: (layer: LayerType) => void;
}

const ReportPanel = ({ report, markers, isAnalyzing, currentUrl, activeLayer, setActiveLayer }: ReportPanelProps) => {
  const emotionMarkers = markers.filter(m => m.layer === 'emotions');
  const needsMarkers = markers.filter(m => m.layer === 'needs');
  const strategyMarkers = markers.filter(m => m.layer === 'strategy');

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
        <h2 className="text-2xl font-black text-gray-900 mb-4">Analysis</h2>
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

        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveLayer('emotions')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-all ${
              activeLayer === 'emotions'
                ? 'text-lem-orange border-b-2 border-lem-orange'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Emotions
          </button>
          <button
            onClick={() => setActiveLayer('needs')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-all ${
              activeLayer === 'needs'
                ? 'text-lem-orange border-b-2 border-lem-orange'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Psych Needs
          </button>
          <button
            onClick={() => setActiveLayer('strategy')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-all ${
              activeLayer === 'strategy'
                ? 'text-lem-orange border-b-2 border-lem-orange'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Strategy
          </button>
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

            {activeLayer === 'emotions' && (
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

            {activeLayer === 'needs' && (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-gray-500">
                    <Brain size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-medium">Psychological Needs Analysis</p>
                    <p className="text-sm mt-1">Coming soon</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeLayer === 'strategy' && (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-gray-500">
                    <Target size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="font-medium">Strategic Insights</p>
                    <p className="text-sm mt-1">Coming soon</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-gradient-to-br from-gray-50 to-orange-50 border-2 border-orange-200">
              <CardContent className="py-8 text-center">
                <Lock size={48} className="mx-auto mb-4 text-lem-orange" />
                <h3 className="font-black text-lg text-gray-900 mb-2">Unlock Deep Insights</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Get detailed persona breakdowns, psychological needs analysis, and a strategic design brief.
                </p>
                <Button className="bg-lem-orange hover:bg-lem-orange-dark text-white font-bold">
                  Unlock Full Report
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportPanel;
