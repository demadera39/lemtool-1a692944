import { EmotionType } from '@/types/lemtool';

export const emotionConfig: Record<EmotionType, { emoji: string; color: string; label: string }> = {
  joy: { emoji: '😊', color: '#FFD700', label: 'Joy' },
  trust: { emoji: '🤝', color: '#4169E1', label: 'Trust' },
  fear: { emoji: '😨', color: '#8B008B', label: 'Fear' },
  surprise: { emoji: '😲', color: '#FF6347', label: 'Surprise' },
  sadness: { emoji: '😢', color: '#4682B4', label: 'Sadness' },
  disgust: { emoji: '🤢', color: '#9ACD32', label: 'Disgust' },
  anger: { emoji: '😠', color: '#DC143C', label: 'Anger' },
  anticipation: { emoji: '🤔', color: '#FF8C00', label: 'Anticipation' },
};
