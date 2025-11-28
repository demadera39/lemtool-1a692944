import { Marker } from '@/types/lemtool';
import { EmotionMarker } from './EmotionMarker';
import { Loader2 } from 'lucide-react';

interface AnalysisCanvasProps {
  url: string;
  markers: Marker[];
  onRemoveMarker: (id: string) => void;
  isAnalyzing: boolean;
}

export const AnalysisCanvas = ({ url, markers, onRemoveMarker, isAnalyzing }: AnalysisCanvasProps) => {
  return (
    <div className="relative w-full h-full bg-white rounded-lg overflow-hidden">
      {isAnalyzing && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">Analyzing emotional impact...</p>
            <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
          </div>
        </div>
      )}
      
      <iframe
        src={url}
        className="w-full h-full border-0"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        title="Website Preview"
      />
      
      {markers.map((marker) => (
        <EmotionMarker
          key={marker.id}
          emotion={marker.emotion}
          x={marker.x}
          y={marker.y}
          comment={marker.comment}
          onRemove={() => onRemoveMarker(marker.id)}
        />
      ))}
    </div>
  );
};
