import { useState } from 'react';
import { EmotionType } from '../types';
import { EMOTIONS } from '../constants';

interface EmotionTokenProps {
  emotion: EmotionType;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  onClick?: () => void;
}

const EmotionToken = ({
  emotion,
  size = 'md',
  selected = false,
  onClick,
}: EmotionTokenProps) => {
  const def = EMOTIONS[emotion];
  
  // Safety check for undefined emotion
  if (!def) {
    console.warn(`Unknown emotion type: ${emotion}`);
    return null;
  }
  
  const Icon = def.icon;
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
  };

  const iconSize = {
    sm: 24,
    md: 36,
    lg: 48
  };

  const paddingClass = imgError ? 'p-2.5 bg-gray-100' : 'p-0 bg-transparent';

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer select-none overflow-hidden
        ${sizeClasses[size]}
        ${selected ? 'ring-4 ring-white scale-125 z-10 animate-pulse' : 'hover:scale-110'}
        ${paddingClass}
      `}
      style={{
        boxShadow: selected 
          ? '0 0 30px rgba(255, 255, 255, 0.9), 0 0 60px rgba(242, 101, 34, 0.5)' 
          : '0 0 20px rgba(255, 255, 255, 0.7), 0 4px 12px rgba(0, 0, 0, 0.15)',
        animation: selected ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : undefined
      }}
      title={def.description}
      role="button"
      aria-label={def.label}
    >
      {!imgError && def.src ? (
        <img
          src={def.src}
          alt={def.label}
          className="w-full h-full object-cover pointer-events-none"
          onError={() => setImgError(true)}
          draggable={false}
        />
      ) : (
        <div className={`w-full h-full flex items-center justify-center rounded-full ${def.category === 'Positive' ? 'text-lem-orange' : 'text-gray-600'}`}>
           <Icon size={iconSize[size]} strokeWidth={2.5} />
        </div>
      )}
    </div>
  );
};

export default EmotionToken;
