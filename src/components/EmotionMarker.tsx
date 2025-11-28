import { emotionConfig } from '@/lib/emotionConfig';
import { EmotionType } from '@/types/lemtool';
import { X } from 'lucide-react';

interface EmotionMarkerProps {
  emotion: EmotionType;
  x: number;
  y: number;
  onRemove?: () => void;
  comment?: string;
}

export const EmotionMarker = ({ emotion, x, y, onRemove, comment }: EmotionMarkerProps) => {
  const config = emotionConfig[emotion];
  
  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className="relative">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl cursor-pointer transition-transform hover:scale-110 shadow-lg border-2 border-white"
          style={{ backgroundColor: config.color }}
          title={comment || config.label}
        >
          {config.emoji}
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
