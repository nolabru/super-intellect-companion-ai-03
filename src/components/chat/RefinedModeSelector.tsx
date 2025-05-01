
import React, { MouseEvent } from 'react';
import { ChatMode } from '@/components/ModeSelector';
import { cn } from '@/lib/utils';
import { Text, Image, Video, AudioLines, PhoneCall } from 'lucide-react';

interface RefinedModeSelectorProps {
  activeMode: ChatMode;
  onChange: (mode: ChatMode) => void;
  className?: string;
}

const RefinedModeSelector: React.FC<RefinedModeSelectorProps> = ({ 
  activeMode, 
  onChange, 
  className 
}) => {
  // Prevent container movement when clicking mode buttons
  const handleModeClick = (e: MouseEvent<HTMLButtonElement>, mode: ChatMode) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(mode);
  };

  return (
    <div className={cn("flex items-center rounded-lg bg-black/20 p-1", className)}>
      {[
        { mode: 'text' as ChatMode, icon: Text, label: 'Texto' },
        { mode: 'image' as ChatMode, icon: Image, label: 'Imagem' },
        { mode: 'video' as ChatMode, icon: Video, label: 'Vídeo' },
        { mode: 'audio' as ChatMode, icon: AudioLines, label: 'Áudio' },
        { mode: 'call' as ChatMode, icon: PhoneCall, label: 'Ligação' }
      ].map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          type="button"
          onClick={(e) => handleModeClick(e, mode)}
          className={cn(
            "relative flex items-center justify-center p-2 rounded-md transition-all",
            "focus:outline-none",
            activeMode === mode 
              ? "text-white bg-inventu-blue/90" 
              : "text-white/60 hover:text-white/80 hover:bg-white/5"
          )}
          title={label}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
};

export default RefinedModeSelector;
