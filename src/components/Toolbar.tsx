import { EMOTIONS } from '../constants';
import EmotionToken from './EmotionToken';
import { EmotionType } from '../types';

interface ToolbarProps {
  onAddMarker: (emotion: EmotionType) => void;
  selectedEmotion?: EmotionType | null;
}

const Toolbar = ({ onAddMarker, selectedEmotion }: ToolbarProps) => {
  return (
    <div className="w-20 bg-card border-r border-border flex flex-col items-center py-4 overflow-y-auto z-20 shadow-lg">
      {/* Logo */}
      <div className="mb-4 text-center flex-shrink-0 flex flex-col items-center pb-4 border-b border-border w-full">
        <img src="/lem-logo.svg" alt="LEM" className="w-10 h-10 mb-1" />
        <h1 className="font-black text-primary text-base tracking-tighter leading-none">LEM</h1>
        <span className="text-[8px] font-medium text-muted-foreground tracking-wider mt-0.5">by METODIC</span>
      </div>

      <div className="flex-1 w-full flex flex-col items-center gap-3 px-2">
        {/* Positive emotions */}
        <div className="space-y-2 text-center w-full">
          <span className="text-[9px] uppercase font-bold text-primary/70 block">Positive</span>
          {Object.values(EMOTIONS).filter(e => e.category === 'Positive').map((def) => (
            <div key={def.id} className="flex flex-col items-center group relative">
              <div className="absolute left-full ml-2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg">
                {def.label}
              </div>
              <button
                onClick={() => onAddMarker(def.id)}
                className={`transition-all rounded-full p-0.5 ${
                  selectedEmotion === def.id 
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-card scale-110' 
                    : 'hover:scale-105'
                }`}
              >
                <EmotionToken emotion={def.id} size="sm" />
              </button>
            </div>
          ))}
        </div>

        <div className="w-10 h-px bg-border my-1"></div>

        {/* Neutral emotions */}
        <div className="space-y-2 text-center w-full">
          <span className="text-[9px] uppercase font-bold text-muted-foreground block">Neutral</span>
          {Object.values(EMOTIONS).filter(e => e.category === 'Neutral').map((def) => (
            <div key={def.id} className="flex flex-col items-center group relative">
              <div className="absolute left-full ml-2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg">
                {def.label}
              </div>
              <button
                onClick={() => onAddMarker(def.id)}
                className={`transition-all rounded-full p-0.5 ${
                  selectedEmotion === def.id 
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-card scale-110' 
                    : 'hover:scale-105'
                }`}
              >
                <EmotionToken emotion={def.id} size="sm" />
              </button>
            </div>
          ))}
        </div>

        <div className="w-10 h-px bg-border my-1"></div>

        {/* Negative emotions */}
        <div className="space-y-2 text-center w-full">
          <span className="text-[9px] uppercase font-bold text-destructive/70 block">Negative</span>
          {Object.values(EMOTIONS).filter(e => e.category === 'Negative').map((def) => (
            <div key={def.id} className="flex flex-col items-center group relative">
              <div className="absolute left-full ml-2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg">
                {def.label}
              </div>
              <button
                onClick={() => onAddMarker(def.id)}
                className={`transition-all rounded-full p-0.5 ${
                  selectedEmotion === def.id 
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-card scale-110' 
                    : 'hover:scale-105'
                }`}
              >
                <EmotionToken emotion={def.id} size="sm" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Toolbar;