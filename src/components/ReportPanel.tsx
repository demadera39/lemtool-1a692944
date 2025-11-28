import { AnalysisReport, Marker, LayerType } from '../types';
import { TrendingUp, Users, Heart, Brain, Lightbulb } from 'lucide-react';
import { Progress } from './ui/progress';

interface ReportPanelProps {
  report: AnalysisReport | null;
  markers: Marker[];
  isAnalyzing: boolean;
  currentUrl: string;
  activeLayer: LayerType;
  setActiveLayer: (layer: LayerType) => void;
}

const ReportPanel = ({
  report,
  markers,
  isAnalyzing,
  currentUrl,
  activeLayer,
  setActiveLayer
}: ReportPanelProps) => {
  if (isAnalyzing) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6 flex items-center justify-center h-full text-center">
        <div className="max-w-sm">
          <div className="w-20 h-20 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">
            📊
          </div>
          <h3 className="text-lg font-semibold mb-2">No Analysis Yet</h3>
          <p className="text-sm text-muted-foreground">
            Enter a website URL and click Analyze to see emotional impact insights
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="text-lem-orange" size={24} />
          <h2 className="text-2xl font-bold text-gray-900">Overall Score</h2>
        </div>
        <div className="text-5xl font-black text-lem-orange mt-4">
          {report.overallScore}
          <span className="text-lg text-gray-400 ml-2">/100</span>
        </div>
        <Progress value={report.overallScore} className="h-2 mt-4" />
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Heart size={18} className="text-lem-orange" />
            Summary
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">{report.summary}</p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Users size={18} className="text-lem-orange" />
            Target Audience
          </h3>
          <p className="text-sm text-gray-600">{report.targetAudience}</p>
          <div className="mt-3 space-y-2">
            {report.audienceSplit.map((split, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-700 font-medium">{split.label}</span>
                  <span className="text-gray-500">{split.percentage}%</span>
                </div>
                <Progress value={split.percentage} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Brain size={18} className="text-lem-orange" />
            SDT Scores
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">Autonomy</span>
                <span className="text-gray-500">{report.sdtScores.autonomy.score}/10</span>
              </div>
              <Progress value={report.sdtScores.autonomy.score * 10} className="h-1.5" />
              <p className="text-xs text-gray-500 mt-1">{report.sdtScores.autonomy.justification}</p>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">Competence</span>
                <span className="text-gray-500">{report.sdtScores.competence.score}/10</span>
              </div>
              <Progress value={report.sdtScores.competence.score * 10} className="h-1.5" />
              <p className="text-xs text-gray-500 mt-1">{report.sdtScores.competence.justification}</p>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">Relatedness</span>
                <span className="text-gray-500">{report.sdtScores.relatedness.score}/10</span>
              </div>
              <Progress value={report.sdtScores.relatedness.score * 10} className="h-1.5" />
              <p className="text-xs text-gray-500 mt-1">{report.sdtScores.relatedness.justification}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Lightbulb size={18} className="text-lem-orange" />
            Key Findings
          </h3>
          <div className="space-y-2">
            {report.keyFindings.map((finding, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-sm text-gray-900 mb-1">{finding.title}</h4>
                <p className="text-xs text-gray-600">{finding.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Suggestions</h3>
          <ul className="space-y-2">
            {report.suggestions.map((suggestion, i) => (
              <li key={i} className="text-sm text-gray-600 flex gap-2">
                <span className="text-lem-orange mt-0.5">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReportPanel;
