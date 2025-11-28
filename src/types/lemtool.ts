export type EmotionType = 'joy' | 'trust' | 'fear' | 'surprise' | 'sadness' | 'disgust' | 'anger' | 'anticipation';

export interface Marker {
  id: string;
  x: number;
  y: number;
  emotion: EmotionType;
  comment?: string;
  timestamp: number;
}

export interface AnalysisReport {
  url: string;
  overallScore: number;
  emotions: {
    [key in EmotionType]: number;
  };
  insights: string[];
  recommendations: string[];
  timestamp: number;
}

export interface Project {
  id: string;
  user_id: string;
  url: string;
  report: AnalysisReport;
  markers: Marker[];
  created_at: string;
  updated_at: string;
}
