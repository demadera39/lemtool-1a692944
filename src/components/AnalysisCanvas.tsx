import React, { useRef, useState, useEffect } from 'react';
import { Marker, EmotionType, LayerType, LayoutSection } from '../types';
import EmotionToken from './EmotionToken';
import { EMOTIONS } from '../constants';
import { X, MousePointer2, Layers, ExternalLink, Brain, Lightbulb, Heart, Zap, AlertTriangle, Info, Camera, MonitorPlay, Presentation, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, User as UserIcon, Bot, Sparkles, PanelTopClose, PanelTopOpen } from 'lucide-react';

interface AnalysisCanvasProps {
  imgUrl: string;
  markers: Marker[];
  setMarkers: React.Dispatch<React.SetStateAction<Marker[]>>;
  isAnalyzing: boolean;
  activeLayer: LayerType;
  setActiveLayer: (layer: LayerType) => void;
  layoutStructure?: LayoutSection[];
  screenshot?: string;
  analysisProgress?: number;
  interactionMode?: 'read_only' | 'place_marker' | 'select_area';
  onCanvasClick?: (x: number, y: number) => void;
  onAreaSelect?: (x: number, y: number, width: number, height: number) => void;
}

const LayerIconRenderer: React.FC<{ layer: LayerType; type?: string }> = ({ layer, type }) => {
  const iconProps = { size: 20, className: "text-white drop-shadow-sm" };
  if (layer === 'needs') {
    if (type === 'Autonomy') return <MousePointer2 {...iconProps} />;
    if (type === 'Competence') return <Zap {...iconProps} />;
    if (type === 'Relatedness') return <Heart {...iconProps} />;
    return <Brain {...iconProps} />;
  }
  if (layer === 'strategy') {
    if (type === 'Opportunity') return <Lightbulb {...iconProps} />;
    if (type === 'Pain Point') return <AlertTriangle {...iconProps} />;
    if (type === 'Insight') return <Info {...iconProps} />;
    return <Lightbulb {...iconProps} />;
  }
  return null;
};

const SpeechBubble: React.FC<{ marker: Marker; onClose: () => void; direction?: 'up' | 'down' }> = ({ marker, onClose, direction }) => {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [computedDirection, setComputedDirection] = useState<'up' | 'down'>(direction || 'up');

  useEffect(() => {
    if (direction || !bubbleRef.current) return;
    const bubble = bubbleRef.current;
    const rect = bubble.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;
    if (spaceAbove < 100 && spaceBelow > spaceAbove) {
      setComputedDirection('down');
    } else {
      setComputedDirection('up');
    }
  }, [direction, marker]);

  let title = 'Insight';
  let accentColor = 'border-primary';
  if (marker.layer === 'emotions' && marker.emotion) {
    title = EMOTIONS[marker.emotion].label;
    accentColor = 'border-primary';
  }
  if (marker.layer === 'needs') {
    title = marker.need || 'Psych Need';
    accentColor = marker.need === 'Autonomy' ? 'border-blue-500' : marker.need === 'Competence' ? 'border-emerald-500' : 'border-pink-500';
  }
  if (marker.layer === 'strategy') {
    title = marker.brief_type || 'Strategic Point';
    accentColor = marker.brief_type === 'Opportunity' ? 'border-emerald-500' : marker.brief_type === 'Pain Point' ? 'border-red-500' : 'border-blue-500';
  }

  const finalDirection = direction || computedDirection;
  const isDown = finalDirection === 'down';
  const positionClass = isDown ? "top-full mt-3" : "bottom-full mb-3";
  const arrowClass = isDown ? "-top-2 rotate-45 border-l border-t" : "-bottom-2 rotate-45 border-r border-b";

  return (
    <div
      ref={bubbleRef}
      className={`absolute w-72 bg-card/95 backdrop-blur-xl rounded-xl shadow-2xl p-4 z-50 transform -translate-x-1/2 left-1/2 flex flex-col ${positionClass} border-2 ${accentColor} animate-in fade-in zoom-in-95 duration-200`}
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
          {marker.source === 'HUMAN' ? <UserIcon size={14} className="text-blue-500" /> : <Bot size={14} className="text-primary" />}
          {title}
        </h4>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors bg-muted rounded-full p-1.5 hover:bg-muted/80">
          <X size={12} />
        </button>
      </div>
      <div className="text-sm text-muted-foreground flex-grow pr-1 max-h-40 overflow-y-auto custom-scrollbar leading-relaxed">
        {marker.comment}
      </div>
      <div className={`absolute left-1/2 transform -translate-x-1/2 w-3 h-3 bg-card border-border ${arrowClass}`}></div>
    </div>
  );
};

const LoadingOverlay = ({ progress = 0 }: { progress?: number }) => {
  const [currentEmotionIndex, setCurrentEmotionIndex] = useState(0);
  const emotionKeys = Object.values(EMOTIONS).map(e => e.id);
  const [statusText, setStatusText] = useState('Capturing screenshot...');

  useEffect(() => {
    const emotionInterval = setInterval(() => {
      setCurrentEmotionIndex(prev => (prev + 1) % emotionKeys.length);
    }, 600);
    return () => clearInterval(emotionInterval);
  }, [emotionKeys.length]);

  useEffect(() => {
    if (progress < 30) setStatusText('Capturing website...');
    else if (progress < 50) setStatusText('Processing screenshot...');
    else if (progress < 70) setStatusText('Analyzing emotions...');
    else if (progress < 90) setStatusText('Generating insights...');
    else setStatusText('Finalizing report...');
  }, [progress]);

  const circumference = 251.2;
  const progressOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="absolute inset-0 bg-background/90 backdrop-blur-md z-40 flex flex-col items-center justify-center pointer-events-none">
      <div className="bg-card rounded-3xl p-10 shadow-2xl border border-border flex flex-col items-center max-w-md">
        <div className="relative w-28 h-28 flex items-center justify-center mb-6">
          <svg className="absolute inset-0 w-full h-full z-10 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" stroke="hsl(var(--muted))" strokeWidth="6" fill="none" />
            <circle 
              cx="50" cy="50" r="40" 
              stroke="hsl(var(--primary))" 
              strokeWidth="6" 
              fill="none" 
              strokeLinecap="round"
              style={{ strokeDasharray: circumference, strokeDashoffset: progressOffset, transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="relative z-20 transform scale-90">
            <EmotionToken emotion={emotionKeys[currentEmotionIndex]} size="lg" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="font-bold text-xl text-foreground mb-2">{statusText}</h3>
          <p className="text-sm text-muted-foreground mb-4">Analyzing UX & emotional triggers</p>
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="text-primary animate-pulse" size={16} />
            <span className="text-2xl font-black text-primary">{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdaptiveWireframe = ({ structure }: { structure: LayoutSection[] }) => {
  const totalHeight = structure.reduce((acc, section) => acc + section.estimatedHeight, 0) || 3000;
  return (
    <div className="w-full min-h-screen bg-muted relative">
      {structure.map((section, i) => {
        const heightPx = section.estimatedHeight;
        const prevHeight = structure.slice(0, i).reduce((acc, s) => acc + s.estimatedHeight, 0);
        return (
          <div 
            key={i} 
            className="absolute left-0 right-0 border-2 border-dashed border-muted-foreground/30 flex items-center justify-center" 
            style={{ top: `${prevHeight}px`, height: `${heightPx}px`, backgroundColor: section.backgroundColorHint === 'dark' ? 'hsl(var(--muted))' : 'hsl(var(--background))' }}
          >
            <span className="text-lg font-bold text-muted-foreground uppercase tracking-wider opacity-50">{section.type}</span>
          </div>
        )
      })}
      <div style={{ height: `${totalHeight}px` }} />
    </div>
  )
};

const AnalysisCanvas: React.FC<AnalysisCanvasProps> = ({
  imgUrl, markers, setMarkers, isAnalyzing, activeLayer, setActiveLayer, layoutStructure, screenshot, analysisProgress = 0,
  interactionMode = 'read_only', onCanvasClick, onAreaSelect
}) => {
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [selectedEmotionMarker, setSelectedEmotionMarker] = useState<Marker | null>(null);
  const [showSchematic, setShowSchematic] = useState(false);
  const [viewMode, setViewMode] = useState<'snapshot' | 'live' | 'presentation'>('snapshot');
  const [toolbarExpanded, setToolbarExpanded] = useState(true);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastScrollTopRef = useRef<number>(0);
  const stationaryFramesRef = useRef<number>(0);
  
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imgNaturalSize, setImgNaturalSize] = useState({ width: 0, height: 0 });
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      if (entries[0]) setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [viewMode]);

  useEffect(() => {
    if (screenshot) setViewMode('snapshot');
  }, [screenshot]);

  useEffect(() => {
    if (isAnalyzing && scrollWrapperRef.current) {
      const el = scrollWrapperRef.current;
      el.scrollTop = 0;
      lastScrollTopRef.current = 0;
      stationaryFramesRef.current = 0;
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = setInterval(() => {
        if (!el) { if(scrollIntervalRef.current) clearInterval(scrollIntervalRef.current); return; }
        const scrollAmount = 2;
        const scrollHeight = el.scrollHeight;
        const clientHeight = el.clientHeight;
        if (el.scrollTop >= scrollHeight - clientHeight - scrollAmount) {
          el.scrollTop = scrollHeight - clientHeight;
          if(scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
          return;
        }
        if (Math.abs(el.scrollTop - lastScrollTopRef.current) < 1) stationaryFramesRef.current += 1;
        else stationaryFramesRef.current = 0;
        lastScrollTopRef.current = el.scrollTop;
        if (stationaryFramesRef.current > 10) {
          el.scrollTop = scrollHeight - clientHeight;
          if(scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
          return;
        }
        el.scrollTop += scrollAmount;
      }, 20);
      return () => { if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current); };
    } else {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    }
  }, [isAnalyzing]);

  const handleBackgroundClick = (e: React.MouseEvent) => {
    setActiveMarkerId(null);
    if (interactionMode === 'place_marker' && onCanvasClick && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      onCanvasClick(x, y);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (interactionMode === 'select_area') {
      const targetRef = imageContainerRef.current || containerRef.current;
      if (targetRef) {
        const rect = targetRef.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setIsSelecting(true);
        setSelectionStart({ x, y });
        setSelectionEnd({ x, y });
        e.preventDefault();
      }
    } else {
      handleBackgroundClick(e);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isSelecting && selectionStart) {
      const targetRef = imageContainerRef.current || containerRef.current;
      if (targetRef) {
        const rect = targetRef.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setSelectionEnd({ x, y });
      }
    }
  };

  const handleMouseUp = () => {
    if (isSelecting && selectionStart && selectionEnd && onAreaSelect) {
      const x = Math.min(selectionStart.x, selectionEnd.x);
      const y = Math.min(selectionStart.y, selectionEnd.y);
      const width = Math.abs(selectionEnd.x - selectionStart.x);
      const height = Math.abs(selectionEnd.y - selectionStart.y);
      if (width > 2 && height > 2) onAreaSelect(x, y, width, height);
    }
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const handleMarkerClick = (e: React.MouseEvent, markerId: string) => {
    e.stopPropagation();
    setActiveMarkerId(markerId);
    const marker = markers.find(m => m.id === markerId);
    if (marker && marker.layer === 'emotions' && marker.emotion) {
      setSelectedEmotionMarker(marker);
    }
  };

  const filteredMarkers = markers.filter(m => m.layer === activeLayer);

  const LayerToggleButton = ({ layer, label, icon, count }: { layer: LayerType, label: string, icon: React.ReactNode, count: number }) => (
    <button 
      onClick={() => setActiveLayer(layer)} 
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all ${
        activeLayer === layer 
          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeLayer === layer ? 'bg-primary-foreground/20' : 'bg-muted'}`}>{count}</span>
    </button>
  );

  const viewportHeight = containerWidth / (16/9);
  const renderedImageHeight = imgNaturalSize.width > 0 ? (imgNaturalSize.height / imgNaturalSize.width) * containerWidth : 0;
  const totalSlides = viewportHeight > 0 ? Math.ceil(renderedImageHeight / viewportHeight) : 1;
  const translateY = currentSlide * viewportHeight;
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => setImgNaturalSize({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight });
  const nextSlide = () => setCurrentSlide(prev => Math.min(prev + 1, totalSlides - 1));
  const prevSlide = () => setCurrentSlide(prev => Math.max(prev - 1, 0));

  const emotionCount = markers.filter(m => m.layer === 'emotions').length;
  const needsCount = markers.filter(m => m.layer === 'needs').length;
  const strategyCount = markers.filter(m => m.layer === 'strategy').length;

  const renderMarker = (marker: Marker) => {
    if (marker.isArea && marker.width && marker.height) {
      const positiveEmotions = [EmotionType.JOY, EmotionType.DESIRE, EmotionType.FASCINATION, EmotionType.SATISFACTION];
      const negativeEmotions = [EmotionType.SADNESS, EmotionType.DISGUST, EmotionType.BOREDOM, EmotionType.DISSATISFACTION];
      const isPositive = marker.emotion && positiveEmotions.includes(marker.emotion);
      const isNegative = marker.emotion && negativeEmotions.includes(marker.emotion);
      
      return (
        <div key={marker.id} className={`absolute pointer-events-none ${activeMarkerId === marker.id ? 'z-50' : 'z-20'}`}
          style={{ left: `${marker.x}%`, top: `${marker.y}%`, width: `${marker.width}%`, height: `${marker.height}%` }}>
          <div className={`w-full h-full border-4 rounded-xl transition-all cursor-pointer pointer-events-auto backdrop-blur-[1px] ${
            activeMarkerId === marker.id ? 'border-primary bg-primary/20 shadow-lg shadow-primary/20' 
            : isPositive ? 'border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20'
            : isNegative ? 'border-red-500 bg-red-500/10 hover:bg-red-500/20'
            : marker.source === 'HUMAN' ? 'border-blue-500 bg-blue-500/10 hover:bg-blue-500/20'
            : 'border-primary bg-primary/10 hover:bg-primary/20'
          }`} onClick={(e) => { e.stopPropagation(); handleMarkerClick(e, marker.id); }}>
            {marker.emotion && (
              <div className="absolute -top-4 -left-4 transform scale-90"><EmotionToken emotion={marker.emotion} selected={activeMarkerId === marker.id} size="md" /></div>
            )}
            {marker.source === 'HUMAN' && (
              <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-1 border-2 border-card shadow-md"><UserIcon size={10} /></div>
            )}
          </div>
          {viewMode !== 'presentation' && activeMarkerId === marker.id && marker.layer !== 'emotions' && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50"><SpeechBubble marker={marker} onClose={() => setActiveMarkerId(null)} /></div>
          )}
        </div>
      );
    }
    
    return (
      <div key={marker.id} className={`absolute pointer-events-none ${activeMarkerId === marker.id ? 'z-50' : 'z-20'}`} style={{ left: `${marker.x}%`, top: `${marker.y}%` }}>
        <div className="relative transform -translate-x-1/2 -translate-y-1/2">
          <div className="animate-float">
            {viewMode !== 'presentation' && activeMarkerId === marker.id && marker.layer !== 'emotions' && (
              <SpeechBubble marker={marker} onClose={() => setActiveMarkerId(null)} />
            )}
            <div className="transform scale-[1.3] origin-center cursor-pointer pointer-events-auto">
              <div onClick={(e) => handleMarkerClick(e, marker.id)} className="relative group">
                {marker.layer === 'emotions' ? (
                  <div className="relative transition-transform group-hover:scale-110">
                    <EmotionToken emotion={marker.emotion || EmotionType.NEUTRAL} selected={activeMarkerId === marker.id} size="lg" />
                    {marker.source === 'HUMAN' && (
                      <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-0.5 border-2 border-card shadow-md"><UserIcon size={8} /></div>
                    )}
                  </div>
                ) : (
                  <div className={`relative w-11 h-11 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-200 ${activeMarkerId === marker.id ? 'ring-4 ring-white/50 scale-110' : 'group-hover:scale-110'}`}>
                    {marker.layer === 'needs' && (
                      <div className={`absolute inset-0 rounded-2xl ${marker.need === 'Autonomy' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : marker.need === 'Competence' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-gradient-to-br from-pink-400 to-pink-600'}`}></div>
                    )}
                    {marker.layer === 'strategy' && (
                      <div className={`absolute inset-0 rounded-2xl ${marker.brief_type === 'Opportunity' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : marker.brief_type === 'Pain Point' ? 'bg-gradient-to-br from-red-400 to-red-600' : 'bg-gradient-to-br from-blue-400 to-blue-600'}`}></div>
                    )}
                    <div className="relative z-10 text-white"><LayerIconRenderer layer={marker.layer} type={marker.need || marker.brief_type} /></div>
                    {marker.source === 'HUMAN' && (
                      <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-0.5 border-2 border-card"><UserIcon size={8} /></div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col relative bg-muted/30">
      {isAnalyzing && <LoadingOverlay progress={analysisProgress} />}

      {/* Expandable Toolbar */}
      {interactionMode === 'read_only' && (
        <div className={`bg-card/95 backdrop-blur-xl border-b border-border z-30 flex-shrink-0 transition-all duration-300 ${toolbarExpanded ? 'max-h-96' : 'max-h-14'} overflow-hidden`}>
          {/* Toggle Button Row */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
            <button 
              onClick={() => setToolbarExpanded(!toolbarExpanded)}
              className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              {toolbarExpanded ? <PanelTopClose size={16} /> : <PanelTopOpen size={16} />}
              <span>{toolbarExpanded ? 'Collapse Toolbar' : 'Expand Toolbar'}</span>
              {!toolbarExpanded && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-2">
                  {emotionCount + needsCount + strategyCount} markers
                </span>
              )}
            </button>
            
            {/* Compact view when collapsed */}
            {!toolbarExpanded && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Heart size={12} className="text-primary" /> {emotionCount}
                  <Brain size={12} className="text-blue-500 ml-2" /> {needsCount}
                  <Lightbulb size={12} className="text-yellow-500 ml-2" /> {strategyCount}
                </div>
              </div>
            )}
          </div>

          {/* Expanded Content */}
          <div className={`px-4 py-3 space-y-3 ${toolbarExpanded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
            {/* Layer Tabs - Full Width */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Analysis Layers</p>
              <div className="flex flex-wrap items-center gap-2">
                <LayerToggleButton layer="emotions" label="Emotions" icon={<Heart size={16} />} count={emotionCount} />
                <LayerToggleButton layer="needs" label="Psych Needs" icon={<Brain size={16} />} count={needsCount} />
                <LayerToggleButton layer="strategy" label="Strategy" icon={<Lightbulb size={16} />} count={strategyCount} />
              </div>
            </div>

            {/* View Controls - Full Width */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">View Options</p>
              <div className="flex flex-wrap items-center gap-2">
                {screenshot && (
                  <>
                    <button onClick={() => { setViewMode('presentation'); setCurrentSlide(0); }}
                      className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all ${viewMode === 'presentation' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:text-foreground'}`}>
                      <Presentation size={14}/> Slides
                    </button>
                    <button onClick={() => setViewMode('snapshot')}
                      className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all ${viewMode === 'snapshot' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:text-foreground'}`}>
                      <Camera size={14}/> Full Page
                    </button>
                    <button onClick={() => setViewMode('live')}
                      className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all ${viewMode === 'live' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:text-foreground'}`}>
                      <MonitorPlay size={14}/> Live
                    </button>
                  </>
                )}
                <button onClick={() => setShowSchematic(!showSchematic)} 
                  className={`px-3 py-2 text-xs rounded-xl font-semibold flex items-center gap-1.5 transition-all ${showSchematic ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:text-foreground'}`}>
                  <Layers size={14}/> Schematic
                </button>
                <a href={imgUrl} target="_blank" rel="noreferrer" 
                  className="px-3 py-2 text-xs rounded-xl font-semibold bg-muted/50 text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-all">
                  <ExternalLink size={14}/> Open Site
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Emotion Banner - Floating */}
      {selectedEmotionMarker && selectedEmotionMarker.emotion && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 max-w-xl w-[90%] bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl z-40 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0"><EmotionToken emotion={selectedEmotionMarker.emotion} size="lg" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-foreground">{EMOTIONS[selectedEmotionMarker.emotion].label}</h3>
                  <button onClick={() => setSelectedEmotionMarker(null)} className="text-muted-foreground hover:text-foreground transition-colors bg-muted hover:bg-muted/80 rounded-full p-2">
                    <X size={16} />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedEmotionMarker.comment}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {screenshot && <img src={screenshot} alt="Reference" className="hidden" onLoad={handleImageLoad} />}

      <div ref={scrollWrapperRef} className="flex-1 overflow-y-auto overflow-x-hidden relative">
        {/* Presentation Mode Navigation */}
        {viewMode === 'presentation' && screenshot && !isAnalyzing && interactionMode === 'read_only' && (
          <div className="sticky top-4 z-40 flex items-center gap-3 bg-card/90 backdrop-blur-xl shadow-xl px-5 py-3 rounded-2xl mb-4 mx-auto w-fit border border-border">
            <button onClick={prevSlide} disabled={currentSlide === 0}
              className="p-2 rounded-xl hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-bold text-foreground px-2">Slide {currentSlide + 1} / {totalSlides}</span>
            <button onClick={nextSlide} disabled={currentSlide === totalSlides - 1}
              className="p-2 rounded-xl hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        <div ref={containerRef}
          className={`relative w-full mx-auto bg-card transition-all duration-300 ${viewMode === 'live' ? 'min-h-[1200vh]' : ''} ${viewMode === 'presentation' ? 'max-w-5xl aspect-video overflow-hidden rounded-2xl shadow-2xl border border-border' : ''} ${viewMode === 'snapshot' ? 'max-w-5xl' : ''} ${interactionMode === 'select_area' ? 'cursor-crosshair' : ''}`}
          onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
          style={{ pointerEvents: isAnalyzing ? 'none' : 'auto', cursor: interactionMode === 'place_marker' ? 'crosshair' : interactionMode === 'select_area' ? 'crosshair' : 'default' }}>
          
          {isSelecting && selectionStart && selectionEnd && viewMode !== 'snapshot' && (
            <div className="absolute border-4 border-primary bg-primary/20 z-30 pointer-events-none rounded-lg"
              style={{ left: `${Math.min(selectionStart.x, selectionEnd.x)}%`, top: `${Math.min(selectionStart.y, selectionEnd.y)}%`, width: `${Math.abs(selectionEnd.x - selectionStart.x)}%`, height: `${Math.abs(selectionEnd.y - selectionStart.y)}%` }} />
          )}

          {/* Presentation Mode Tooltip */}
          {viewMode === 'presentation' && activeMarkerId && (() => {
            const activeMarker = filteredMarkers.find(m => m.id === activeMarkerId);
            if (!activeMarker) return null;
            const globalY = (activeMarker.y / 100) * renderedImageHeight;
            const offset = currentSlide * viewportHeight;
            const localY = globalY - offset;
            if (localY < -50 || localY > viewportHeight + 50) return null;
            return (
              <div className="absolute inset-0 z-50 pointer-events-none overflow-visible">
                <div style={{ position: 'absolute', left: `${activeMarker.x}%`, top: `${localY}px` }} className="pointer-events-auto">
                  <SpeechBubble marker={activeMarker} onClose={() => setActiveMarkerId(null)} direction={localY < 200 ? 'down' : 'up'} />
                </div>
              </div>
            );
          })()}

          {showSchematic ? (
            <div className="w-full min-h-screen relative">
              <AdaptiveWireframe structure={layoutStructure || []} />
              <div className="absolute inset-0 z-10 pointer-events-none">{filteredMarkers.filter(m => !m.isArea).map(renderMarker)}</div>
            </div>
          ) : viewMode === 'presentation' && screenshot ? (
            <div className="w-full h-full relative bg-foreground/5">
              <div className="w-full transition-transform duration-500 ease-out relative" style={{ transform: `translateY(-${translateY}px)` }}>
                <img src={screenshot} className="w-full h-auto block" alt="Analyzed Slide"/>
                <div className="absolute inset-0 z-10">{filteredMarkers.map(renderMarker)}</div>
              </div>
            </div>
          ) : viewMode === 'snapshot' && screenshot ? (
            <div className="relative w-full max-h-[75vh] overflow-y-auto rounded-2xl border border-border shadow-xl">
              <div ref={imageContainerRef} className="relative w-full"
                onMouseDown={interactionMode === 'select_area' ? handleMouseDown : undefined}
                onMouseMove={interactionMode === 'select_area' ? handleMouseMove : undefined}
                onMouseUp={interactionMode === 'select_area' ? handleMouseUp : undefined}
                onMouseLeave={interactionMode === 'select_area' ? handleMouseUp : undefined}>
                <img src={screenshot} className="w-full h-auto block" alt="Analyzed Screenshot"/>
                {isSelecting && selectionStart && selectionEnd && (
                  <div className="absolute border-4 border-primary bg-primary/20 z-30 pointer-events-none rounded-lg"
                    style={{ left: `${Math.min(selectionStart.x, selectionEnd.x)}%`, top: `${Math.min(selectionStart.y, selectionEnd.y)}%`, width: `${Math.abs(selectionEnd.x - selectionStart.x)}%`, height: `${Math.abs(selectionEnd.y - selectionStart.y)}%` }} />
                )}
                <div className="absolute inset-0 z-10 pointer-events-none">{filteredMarkers.map(renderMarker)}</div>
              </div>
            </div>
          ) : (
            <>
              <div className="absolute inset-0 z-0">
                <iframe src={imgUrl} className={`w-full h-full border-none transition-opacity duration-300 ${isAnalyzing ? 'opacity-50 blur-sm' : 'opacity-100'}`} title="Live Website" sandbox="allow-scripts allow-same-origin" />
              </div>
              <div className="absolute inset-0 z-10" style={{ pointerEvents: 'auto' }}>{filteredMarkers.map(renderMarker)}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisCanvas;