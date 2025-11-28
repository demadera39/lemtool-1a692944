import { AnalysisReport } from '@/types/lemtool';
import { emotionConfig } from '@/lib/emotionConfig';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Lightbulb, Target } from 'lucide-react';

interface ReportPanelProps {
  report: AnalysisReport | null;
  isAnalyzing: boolean;
}

export const ReportPanel = ({ report, isAnalyzing }: ReportPanelProps) => {
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
    <div className="p-6 space-y-6 h-full overflow-y-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            Overall Score
          </CardTitle>
          <CardDescription>Emotional impact rating</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary mb-2">
            {report.overallScore}
            <span className="text-lg text-muted-foreground">/100</span>
          </div>
          <Progress value={report.overallScore} className="h-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Emotion Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(report.emotions).map(([emotion, value]) => {
            const config = emotionConfig[emotion as keyof typeof emotionConfig];
            return (
              <div key={emotion} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span>{config.emoji}</span>
                    <span className="font-medium">{config.label}</span>
                  </span>
                  <span className="text-muted-foreground">{value}%</span>
                </div>
                <Progress value={value} className="h-1.5" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {report.insights.map((insight, index) => (
              <li key={index} className="text-sm flex gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {report.recommendations.map((rec, index) => (
              <Badge key={index} variant="secondary" className="text-xs py-1.5 px-3 block">
                {rec}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
