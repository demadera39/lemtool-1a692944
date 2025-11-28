import { useRef, useState } from 'react';
import { Marker, EmotionType, LayerType } from '../types';
import EmotionToken from './EmotionToken';
import { EMOTIONS } from '../constants';
import { X, MonitorPlay, Presentation, ChevronLeft, ChevronRight, ExternalLink, Layers } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface AnalysisCanvasProps {
  imgUrl: string;
  markers: Marker[];
  setMarkers: React.Dispatch<React.SetStateAction<Marker[]>>;
  isAnalyzing: boolean;
  activeLayer: LayerType;
  setActiveLayer: (layer: LayerType) => void;
  screenshot?: string;
}

const LOADING_MESSAGES = [
    "Step 1/3: Reading Emotions...",
    "Step 2/3: Analyzing Needs...",
    "Step 3/3: Strategizing Brief..."
];

const LoadingOverlay = () => {
    const [currentEmotionIndex, setCurrentEmotionIndex] = useState(0);
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
    const emotionKeys = Object.values(EMOTIONS).map(e => e.id);

    return (
      <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-sm z-40 flex flex-col items-center justify-center pointer-events-none">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <div className="relative z-20">
              <Loader2 className="w-20 h-20 text-lem-orange animate-spin" />
          </div>
        </div>
        <div className="mt-8 bg-white/80 backdrop-blur-md rounded-full px-8 py-4 shadow-lg z-20">
          <p className="font-bold text-gray-800 flex items-center gap-3 text-lg">
            <span className="w-3 h-3 bg-lem-orange rounded-full animate-pulse"></span>
            {LOADING_MESSAGES[loadingMessageIndex]}
          </p>
        </div>
      </div>
    );
};

const SpeechBubble = ({ marker, onClose }: { marker: Marker; onClose: () => void }) => {
    let title = 'Insight';
    if (marker.layer === 'emotions' && marker.emotion) title = EMOTIONS[marker.emotion].label;
    if (marker.layer === 'needs') title = marker.need || 'Psych Need';
    if (marker.layer === 'strategy') title = marker.brief_type || 'Strategic Point';

    const isDown = marker.y < 20;
    const positionClass = isDown ? "top-full mt-4" : "bottom-full mb-4";
    const arrowClass = isDown ? "-top-2 rotate-45 border-l border-t" : "-bottom-2 rotate-45 border-r border-b";

    return (
      <div
        className={`absolute w-80 bg-white rounded-lg shadow-2xl p-4 z-50 transform -translate-x-1/2 left-1/2 flex flex-col ${positionClass} border border-gray-100 animate-in fade-in zoom-in-95 duration-200`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-2">
          <h4 className="font-bold text-sm text-gray-900">{title}</h4>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors bg-gray-50 rounded-full p-1">
            <X size={14} />
          </button>
        </div>
        <div className="text-sm text-gray-600">{marker.comment}</div>
        <div className={`absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-gray-100 ${arrowClass}`}></div>
      </div>
    );
};

const AnalysisCanvas = ({
    imgUrl, markers, setMarkers, isAnalyzing, activeLayer, setActiveLayer, screenshot
}: AnalysisCanvasProps) => {
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'live' | 'snapshot'>('live');
  const [currentSlide, setCurrentSlide] = useState(1);
  const [totalSlides] = useState(8);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);

  const filteredMarkers = markers.filter(m => m.layer === activeLayer);

  const handleMarkerClick = (id: string) => {
    setActiveMarkerId(activeMarkerId === id ? null : id);
  };

  const handleRemoveMarker = (id: string) => {
    setMarkers(prev => prev.filter(m => m.id !== id));
    setActiveMarkerId(null);
  };

  return (
    <div className="w-full h-full bg-gray-100 relative flex flex-col rounded-lg shadow-inner overflow-hidden">
      {isAnalyzing && <LoadingOverlay />}

      <div className="absolute top-4 left-4 z-30 flex gap-2">
        <button
          onClick={() => setActiveLayer('emotions')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeLayer === 'emotions' ? 'bg-lem-orange text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
        >
          Emotions
        </button>
        <button
          onClick={() => setActiveLayer('needs')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeLayer === 'needs' ? 'bg-lem-orange text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
        >
          Needs
        </button>
        <button
          onClick={() => setActiveLayer('strategy')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeLayer === 'strategy' ? 'bg-lem-orange text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
        >
          Strategy
        </button>
      </div>

      <div className="absolute top-4 right-4 z-30 flex gap-2">
        <button
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2"
          title="Slides"
        >
          <Layers size={14} />
          Slides
        </button>
        <button
          onClick={() => setScrollEnabled(!scrollEnabled)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${scrollEnabled ? 'bg-lem-orange text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          title="Toggle Scroll"
        >
          Scroll
        </button>
        <button
          onClick={() => setViewMode('live')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'live' ? 'bg-lem-orange text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          title="Live Site"
        >
          Live Site
        </button>
        <button
          onClick={() => setViewMode('snapshot')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'snapshot' ? 'bg-lem-orange text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          title="Schematic View"
        >
          Schematic View
        </button>
        <button
          onClick={() => window.open(imgUrl, '_blank')}
          className="p-2 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 transition-all"
          title="Open in New Tab"
        >
          <ExternalLink size={16} />
        </button>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex items-center gap-4 pointer-events-none">
        <button
          onClick={() => setCurrentSlide(Math.max(1, currentSlide - 1))}
          className="pointer-events-auto p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all disabled:opacity-50"
          disabled={currentSlide === 1}
        >
          <ChevronLeft size={20} />
        </button>
        <div className="px-4 py-2 rounded-full bg-white/90 shadow-lg font-medium text-sm pointer-events-auto">
          Slide {currentSlide} / {totalSlides}
        </div>
        <button
          onClick={() => setCurrentSlide(Math.min(totalSlides, currentSlide + 1))}
          className="pointer-events-auto p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all disabled:opacity-50"
          disabled={currentSlide === totalSlides}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div ref={scrollWrapperRef} className={`flex-1 relative ${scrollEnabled ? 'overflow-auto' : 'overflow-hidden'}`}>
        {viewMode === 'live' ? (
          <iframe
            src={imgUrl}
            className="w-full h-full border-0 bg-white"
            title="Website Preview"
            style={{ pointerEvents: scrollEnabled ? 'auto' : 'none' }}
          />
        ) : screenshot ? (
          <img src={screenshot} alt="Website Snapshot" className="w-full h-auto" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No snapshot available
          </div>
        )}

        {filteredMarkers.map((marker) => (
          <div
            key={marker.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
            onClick={() => handleMarkerClick(marker.id)}
          >
            {marker.layer === 'emotions' && marker.emotion && (
              <EmotionToken emotion={marker.emotion} size="md" selected={activeMarkerId === marker.id} />
            )}
            {activeMarkerId === marker.id && (
              <SpeechBubble marker={marker} onClose={() => setActiveMarkerId(null)} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalysisCanvas;
