import React, { useRef, useState, useEffect } from 'react';
import { Marker, EmotionType, LayerType, LayoutSection } from '../types';
import EmotionToken from './EmotionToken';
import { EMOTIONS } from '../constants';
import { X, MousePointer2, Layers, ExternalLink, Brain, Lightbulb, Heart, Zap, AlertTriangle, Info, Camera, MonitorPlay, Presentation, ChevronRight, ChevronLeft, User as UserIcon, Bot } from 'lucide-react';

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

  // New Props for Participant Mode
  interactionMode?: 'read_only' | 'place_marker' | 'select_area';
  onCanvasClick?: (x: number, y: number) => void;
  onAreaSelect?: (x: number, y: number, width: number, height: number) => void;
}

const LayerIconRenderer: React.FC<{ layer: LayerType; type?: string }> = ({ layer, type }) => {
    const iconProps = { size: 24, className: "text-white" };
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

// Smart SpeechBubble with viewport-aware positioning
const SpeechBubble: React.FC<{ marker: Marker; onClose: () => void; direction?: 'up' | 'down' }> = ({ marker, onClose, direction }) => {
    const bubbleRef = useRef<HTMLDivElement>(null);
    const [computedDirection, setComputedDirection] = useState<'up' | 'down'>(direction || 'up');

    useEffect(() => {
        if (direction || !bubbleRef.current) return;
        
        const bubble = bubbleRef.current;
        const rect = bubble.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // Check if bubble would be cut off at top or bottom
        const spaceAbove = rect.top;
        const spaceBelow = viewportHeight - rect.bottom;
        
        // Default to up, but flip to down if not enough space above
        if (spaceAbove < 100 && spaceBelow > spaceAbove) {
            setComputedDirection('down');
        } else {
            setComputedDirection('up');
        }
    }, [direction, marker]);

    let title = 'Insight';
    if (marker.layer === 'emotions' && marker.emotion) title = EMOTIONS[marker.emotion].label;
    if (marker.layer === 'needs') title = marker.need || 'Psych Need';
    if (marker.layer === 'strategy') title = marker.brief_type || 'Strategic Point';

    const finalDirection = direction || computedDirection;
    const isDown = finalDirection === 'down';

    const positionClass = isDown ? "top-full mt-4" : "bottom-full mb-4";
    const arrowClass = isDown ? "-top-2 rotate-45 border-l border-t" : "-bottom-2 rotate-45 border-r border-b";

    return (
      <div
        ref={bubbleRef}
        className={`absolute w-80 bg-white rounded-lg shadow-2xl p-4 z-50 transform -translate-x-1/2 left-1/2 flex flex-col ${positionClass} border border-gray-100 animate-in fade-in zoom-in-95 duration-200`}
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-2">
          <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            {marker.source === 'HUMAN' ? <UserIcon size={14} className="text-blue-500" /> : <Bot size={14} className="text-lem-orange" />}
            {title}
          </h4>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors bg-gray-50 rounded-full p-1">
            <X size={14} />
          </button>
        </div>

        <div className="text-sm text-gray-600 flex-grow pr-1 max-h-48 overflow-y-auto custom-scrollbar leading-relaxed">
           {marker.comment}
        </div>
        <div className={`absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-gray-100 ${arrowClass}`}></div>
      </div>
    );
};

const LoadingOverlay = ({ progress = 0 }: { progress?: number }) => {
    const [currentEmotionIndex, setCurrentEmotionIndex] = useState(0);
    const emotionKeys = Object.values(EMOTIONS).map(e => e.id);

    useEffect(() => {
      const emotionInterval = setInterval(() => {
        setCurrentEmotionIndex(prev => (prev + 1) % emotionKeys.length);
      }, 800);

      return () => {
        clearInterval(emotionInterval);
      };
    }, [emotionKeys.length]);

    // Calculate circle progress (circumference = 2πr, r=40 so circumference ≈ 251.2)
    const circumference = 251.2;
    const progressOffset = circumference - (progress / 100) * circumference;

    return (
      <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-sm z-40 flex flex-col items-center justify-center pointer-events-none">
        <div className="relative w-32 h-32 flex items-center justify-center">
           <svg className="absolute inset-0 w-full h-full z-10 -rotate-90" viewBox="0 0 100 100">
             {/* Background circle */}
             <circle cx="50" cy="50" r="40" stroke="#E5E7EB" strokeWidth="6" fill="none" />
             {/* Progress circle */}
             <circle 
               cx="50" 
               cy="50" 
               r="40" 
               stroke="#F26522" 
               strokeWidth="6" 
               fill="none" 
               style={{ 
                 strokeDasharray: circumference, 
                 strokeDashoffset: progressOffset,
                 transition: 'stroke-dashoffset 0.3s ease'
               }}
             />
          </svg>
          <div className="relative z-20">
              <EmotionToken emotion={emotionKeys[currentEmotionIndex]} size="lg" />
          </div>
        </div>
        <div className="mt-8 bg-white/80 backdrop-blur-md rounded-full px-8 py-4 shadow-lg z-20">
          <p className="font-bold text-gray-800 flex items-center gap-3 text-lg">
            <span className="w-3 h-3 bg-lem-orange rounded-full animate-pulse"></span>
            <span>Analyzing UX</span>
          </p>
        </div>
      </div>
    );
};

const AdaptiveWireframe = ({ structure }: { structure: LayoutSection[] }) => {
    const totalHeight = structure.reduce((acc, section) => acc + section.estimatedHeight, 0) || 12000;

    return (
        <div className="w-full h-full bg-gray-50 border-r border-gray-200 p-4 space-y-4">
            {structure.map((section, i) => {
                const height = (section.estimatedHeight / totalHeight) * 100;
                return (
                    <div key={i} className="border border-dashed border-gray-300 rounded p-2 text-center bg-gray-100" style={{ minHeight: `${Math.max(5, height)}%`, backgroundColor: section.backgroundColorHint === 'dark' ? '#4a4a4a' : '#f0f0f0' }}>
                        <span className="text-xs text-gray-400 font-mono uppercase">{section.type}</span>
                    </div>
                )
            })}
        </div>
    )
};

const AnalysisCanvas: React.FC<AnalysisCanvasProps> = ({
    imgUrl, markers, setMarkers, isAnalyzing, activeLayer, setActiveLayer, layoutStructure, screenshot, analysisProgress = 0,
    interactionMode = 'read_only', onCanvasClick, onAreaSelect
}) => {
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [showSchematic, setShowSchematic] = useState(false);
  const [viewMode, setViewMode] = useState<'snapshot' | 'live' | 'presentation'>('live');
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastScrollTopRef = useRef<number>(0);
  const stationaryFramesRef = useRef<number>(0);
  
  // Area selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);

  // Presentation Mode State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imgNaturalSize, setImgNaturalSize] = useState({ width: 0, height: 0 });
  const [containerWidth, setContainerWidth] = useState(0);

  // Measure container for pixel-perfect slide calculation
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
        if (entries[0]) setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [viewMode]);

  // Switch to snapshot/scroll mode automatically when a screenshot becomes available
  useEffect(() => {
    if (screenshot) {
        // Default to snapshot (scrollable) for both read and place_marker modes
        setViewMode('snapshot');
    }
  }, [screenshot]);

  // Auto-scroll logic for "Scan" effect in Live/Snapshot (Scroll) mode
  useEffect(() => {
    if (isAnalyzing && scrollWrapperRef.current) {
        const el = scrollWrapperRef.current;
        el.scrollTop = 0;
        lastScrollTopRef.current = 0;
        stationaryFramesRef.current = 0;

        if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);

        scrollIntervalRef.current = setInterval(() => {
            if (!el) {
                if(scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
                return;
            }
            const scrollAmount = 2;
            const scrollHeight = el.scrollHeight;
            const clientHeight = el.clientHeight;

            if (el.scrollTop >= scrollHeight - clientHeight - scrollAmount) {
                el.scrollTop = scrollHeight - clientHeight;
                if(scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
                return;
            }

            if (Math.abs(el.scrollTop - lastScrollTopRef.current) < 1) {
                stationaryFramesRef.current += 1;
            } else {
                stationaryFramesRef.current = 0;
            }
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
      if (interactionMode === 'select_area' && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          setIsSelecting(true);
          setSelectionStart({ x, y });
          setSelectionEnd({ x, y });
      } else {
          handleBackgroundClick(e);
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (isSelecting && selectionStart && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          setSelectionEnd({ x, y });
      }
  };

  const handleMouseUp = () => {
      if (isSelecting && selectionStart && selectionEnd && onAreaSelect) {
          const x = Math.min(selectionStart.x, selectionEnd.x);
          const y = Math.min(selectionStart.y, selectionEnd.y);
          const width = Math.abs(selectionEnd.x - selectionStart.x);
          const height = Math.abs(selectionEnd.y - selectionStart.y);
          
          // Only create area if it's big enough (minimum 2% in both dimensions)
          if (width > 2 && height > 2) {
              onAreaSelect(x, y, width, height);
          }
      }
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
  };

  const handleMarkerClick = (e: React.MouseEvent, markerId: string) => {
      e.stopPropagation();
      setActiveMarkerId(markerId);
  };

  const filteredMarkers = markers.filter(m => m.layer === activeLayer);

  const LayerToggleButton = ({ layer, label, icon }: { layer: LayerType, label: string, icon: React.ReactNode }) => (
    <button onClick={() => setActiveLayer(layer)} className={`flex-grow flex items-center justify-center gap-2 px-3 py-1 text-xs font-bold rounded-md transition-all ${activeLayer === layer ? 'bg-white text-lem-orange shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>{icon}{label}</button>
  );

  // Presentation Mode Calculations
  const viewportHeight = containerWidth / (16/9);
  const renderedImageHeight = imgNaturalSize.width > 0
    ? (imgNaturalSize.height / imgNaturalSize.width) * containerWidth
    : 0;

  const totalSlides = viewportHeight > 0 ? Math.ceil(renderedImageHeight / viewportHeight) : 1;
  const translateY = currentSlide * viewportHeight;

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
     setImgNaturalSize({
         width: e.currentTarget.naturalWidth,
         height: e.currentTarget.naturalHeight
     });
  };

  const nextSlide = () => setCurrentSlide(prev => Math.min(prev + 1, totalSlides - 1));
  const prevSlide = () => setCurrentSlide(prev => Math.max(prev - 1, 0));

  // Helper to render a marker
  const renderMarker = (marker: Marker) => {
    if (marker.isArea && marker.width && marker.height) {
      // Render area marker
      return (
        <div
          key={marker.id}
          className="absolute z-20 pointer-events-none"
          style={{ 
            left: `${marker.x}%`, 
            top: `${marker.y}%`,
            width: `${marker.width}%`,
            height: `${marker.height}%`
          }}
        >
          <div 
            className={`w-full h-full border-4 rounded-lg transition-all cursor-pointer pointer-events-auto ${
              activeMarkerId === marker.id 
                ? 'border-lem-orange bg-lem-orange/20' 
                : marker.source === 'HUMAN'
                ? 'border-blue-500 bg-blue-500/10 hover:bg-blue-500/20'
                : 'border-lem-orange bg-lem-orange/10 hover:bg-lem-orange/20'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              handleMarkerClick(e, marker.id);
            }}
          >
            {/* Emotion token in top-left corner */}
            {marker.emotion && (
              <div className="absolute -top-3 -left-3">
                <EmotionToken emotion={marker.emotion} selected={activeMarkerId === marker.id} size="sm" />
              </div>
            )}
            {/* Source indicator */}
            {marker.source === 'HUMAN' && (
              <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-0.5 border-2 border-white" title="Participant Feedback">
                <UserIcon size={8} />
              </div>
            )}
          </div>
          {viewMode !== 'presentation' && activeMarkerId === marker.id && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50">
              <SpeechBubble marker={marker} onClose={() => setActiveMarkerId(null)} />
            </div>
          )}
        </div>
      );
    }
    
    // Render point marker (existing code)
    return (
        <div
            key={marker.id}
            className="absolute z-20 pointer-events-none"
            style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
        >
                <div className="relative transform -translate-x-1/2 -translate-y-1/2">
                <div className="animate-float">
                    {viewMode !== 'presentation' && activeMarkerId === marker.id && (
                        <SpeechBubble marker={marker} onClose={() => setActiveMarkerId(null)} />
                    )}
                    <div className="transform scale-150 origin-center cursor-pointer pointer-events-auto">
                        <div onClick={(e) => handleMarkerClick(e, marker.id)} className="relative">
                            {/* MARKER RENDERING */}
                            {marker.layer === 'emotions' ? (
                                <div className="relative">
                                    <EmotionToken emotion={marker.emotion || EmotionType.NEUTRAL} selected={activeMarkerId === marker.id} size="lg" />
                                    {marker.source === 'HUMAN' && (
                                        <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-0.5 border-2 border-white" title="Participant Feedback">
                                            <UserIcon size={8} />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className={`relative w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${activeMarkerId === marker.id ? 'ring-4 ring-white ring-opacity-50 scale-110 z-10' : 'hover:scale-105'}`}>
                                    {marker.layer === 'needs' && (
                                        <div className={`absolute inset-0 rounded-full opacity-70 ${marker.need === 'Autonomy' ? 'bg-blue-400' : marker.need === 'Competence' ? 'bg-green-400' : marker.need === 'Relatedness' ? 'bg-pink-400' : 'bg-purple-400'}`}></div>
                                    )}
                                    {marker.layer === 'strategy' && (
                                        <div className={`absolute inset-0 rounded-full opacity-80 ${marker.brief_type === 'Opportunity' ? 'bg-green-500 animate-pulse-strong' : marker.brief_type === 'Pain Point' ? 'bg-red-500 animate-pulse-strong' : marker.brief_type === 'Insight' ? 'bg-blue-500' : 'bg-yellow-500'}`}></div>
                                    )}
                                    <div className="relative z-10 text-white">
                                        <LayerIconRenderer layer={marker.layer} type={marker.need || marker.brief_type} />
                                    </div>
                                    {marker.source === 'HUMAN' && (
                                        <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-0.5 border-2 border-white">
                                            <UserIcon size={8} />
                                        </div>
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
    <div className="w-full h-full flex flex-col relative bg-gray-200">
      {isAnalyzing && <LoadingOverlay progress={analysisProgress} />}

      {/* HEADER BAR - Only show controls in View Mode */}
      {interactionMode === 'read_only' && (
          <div className="h-12 bg-white/70 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between px-4 z-30 flex-shrink-0">
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <LayerToggleButton layer="emotions" label="Emotions" icon={<Heart size={14} />} />
              <LayerToggleButton layer="needs" label="Psych Needs" icon={<Brain size={14} />} />
              <LayerToggleButton layer="strategy" label="Strategy" icon={<Lightbulb size={14} />} />
            </div>

            <div className="flex items-center gap-4">
                {screenshot && (
                    <div className="flex bg-gray-100 rounded-lg p-1">
                         <button
                            onClick={() => { setViewMode('presentation'); setCurrentSlide(0); }}
                            className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition-all ${viewMode === 'presentation' ? 'bg-white text-lem-orange shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            title="View analysis slide by slide"
                        >
                            <Presentation size={14}/> Slides
                        </button>
                        <button
                            onClick={() => setViewMode('snapshot')}
                            className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition-all ${viewMode === 'snapshot' ? 'bg-white text-lem-orange shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            title="View precise AI analysis on static screenshot"
                        >
                            <Camera size={14}/> Scroll
                        </button>
                        <button
                            onClick={() => setViewMode('live')}
                            className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition-all ${viewMode === 'live' ? 'bg-white text-lem-orange shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            title="View interactive live website"
                        >
                            <MonitorPlay size={14}/> Live Site
                        </button>
                    </div>
                )}

                 <button onClick={() => setShowSchematic(!showSchematic)} className={`px-3 py-1 text-xs rounded-md font-bold flex items-center gap-1 ${showSchematic ? 'bg-lem-orange text-white' : 'bg-gray-200 text-gray-600'}`}><Layers size={14}/> Schematic View</button>
                 <a href={imgUrl} target="_blank" rel="noreferrer" className="px-3 py-1 text-xs rounded-md font-bold bg-gray-200 text-gray-600 flex items-center gap-1"><ExternalLink size={14}/> Open in New Tab</a>
            </div>
          </div>
      )}

      {/* BLOCKED IFrame Warning */}
      {isAnalyzing && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-yellow-100 text-yellow-800 text-sm font-bold px-4 py-2 rounded-lg shadow-lg z-35 flex items-center gap-2 cursor-pointer" onClick={() => setShowSchematic(true)}>
            <AlertTriangle size={16} />
            <span>Website preview might be blocked. Click here to switch to Schematic View if it's blank.</span>
        </div>
      )}

      {screenshot && (
          <img
            src={screenshot}
            alt="Reference"
            className="hidden"
            onLoad={handleImageLoad}
          />
      )}

      <div ref={scrollWrapperRef} className="flex-1 overflow-y-auto overflow-x-hidden relative">
        {viewMode === 'presentation' && screenshot && !isAnalyzing && interactionMode === 'read_only' && (
            <div className="sticky top-4 z-40 flex items-center gap-4 bg-white/90 backdrop-blur shadow-lg px-4 py-2 rounded-full mb-4 mx-auto w-fit">
                <button
                    onClick={prevSlide}
                    disabled={currentSlide === 0}
                    className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronLeft size={24} />
                </button>
                <span className="text-sm font-bold text-gray-700">
                    Slide {currentSlide + 1} / {totalSlides}
                </span>
                <button
                    onClick={nextSlide}
                    disabled={currentSlide === totalSlides - 1}
                    className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronRight size={24} />
                </button>
            </div>
        )}

        <div
            ref={containerRef}
            className={`relative w-full mx-auto bg-gray-50 shadow-2xl transition-all duration-300 ${viewMode === 'live' ? 'min-h-[1200vh]' : ''} ${viewMode === 'presentation' ? 'max-w-6xl aspect-video overflow-hidden rounded-xl bg-gray-900' : ''} ${viewMode === 'snapshot' ? 'max-w-6xl' : ''} ${interactionMode === 'select_area' ? 'cursor-crosshair' : ''}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
                pointerEvents: isAnalyzing ? 'none' : 'auto',
                cursor: interactionMode === 'place_marker' ? 'crosshair' : interactionMode === 'select_area' ? 'crosshair' : 'default'
            }}
        >
          {/* Selection overlay */}
          {isSelecting && selectionStart && selectionEnd && (
            <div
              className="absolute border-4 border-lem-orange bg-lem-orange/20 z-30 pointer-events-none"
              style={{
                left: `${Math.min(selectionStart.x, selectionEnd.x)}%`,
                top: `${Math.min(selectionStart.y, selectionEnd.y)}%`,
                width: `${Math.abs(selectionEnd.x - selectionStart.x)}%`,
                height: `${Math.abs(selectionEnd.y - selectionStart.y)}%`,
              }}
            />
          )}
          {/* Top-Level Tooltip Overlay for Presentation Mode - PREVENTS CLIPPING */}
          {viewMode === 'presentation' && activeMarkerId && (
              (() => {
                const activeMarker = filteredMarkers.find(m => m.id === activeMarkerId);
                if (!activeMarker) return null;
                const globalY = (activeMarker.y / 100) * renderedImageHeight;
                const offset = currentSlide * viewportHeight;
                const localY = globalY - offset;
                if (localY < -50 || localY > viewportHeight + 50) return null;
                const left = `${activeMarker.x}%`;
                const top = `${localY}px`;
                const isAtTop = localY < 200;

                return (
                    <div className="absolute inset-0 z-50 pointer-events-none overflow-visible">
                        <div style={{ position: 'absolute', left, top }} className="pointer-events-auto">
                             <SpeechBubble
                                marker={activeMarker}
                                onClose={() => setActiveMarkerId(null)}
                                direction={isAtTop ? 'down' : 'up'}
                             />
                        </div>
                    </div>
                );
              })()
          )}

          {showSchematic ? (
             <div className="absolute inset-0 z-0 h-full">
                <AdaptiveWireframe structure={layoutStructure || []} />
             </div>
          ) : viewMode === 'presentation' && screenshot ? (
            <div className="w-full h-full relative">
                 <div
                    className="w-full transition-transform duration-500 ease-in-out relative"
                    style={{ transform: `translateY(-${translateY}px)` }}
                 >
                    <img src={screenshot} className="w-full h-auto block" alt="Analyzed Slide"/>
                    <div className="absolute inset-0 z-10">
                        {filteredMarkers.map((marker) => renderMarker(marker))}
                    </div>
                 </div>
            </div>
          ) : viewMode === 'snapshot' && screenshot ? (
            <div className="relative w-full">
                <img src={screenshot} className="w-full h-auto block" alt="Analyzed Screenshot"/>
                 <div className="absolute inset-0 z-10">
                    {filteredMarkers.map((marker) => renderMarker(marker))}
                 </div>
            </div>
          ) : (
            <>
              <div className="absolute inset-0 z-0">
                <iframe
                    src={imgUrl}
                    className={`w-full h-full border-none transition-opacity duration-300 ${isAnalyzing ? 'opacity-50 blur-sm' : 'opacity-100'}`}
                    title="Live Website"
                    sandbox="allow-scripts allow-same-origin"
                />
              </div>
              <div className="absolute inset-0 z-10" style={{ pointerEvents: 'auto' }}>
                {filteredMarkers.map((marker) => renderMarker(marker))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisCanvas;
