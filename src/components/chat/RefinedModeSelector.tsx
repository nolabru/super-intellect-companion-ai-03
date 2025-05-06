
import React, { memo } from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Text, Image, Video, AudioLines, PhoneCall, Music } from 'lucide-react';
import { ChatMode } from '../ModeSelector';
import { cn } from '@/lib/utils';
import { useTouchDevice } from '@/hooks/useTouchDevice';

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
  const isTouchDevice = useTouchDevice();
  
  // Using a constant array to avoid recreation on each render
  const modes = [
    { value: 'text', icon: Text, label: 'Texto' },
    { value: 'image', icon: Image, label: 'Imagem' },
    { value: 'video', icon: Video, label: 'Vídeo' },
    { value: 'audio', icon: AudioLines, label: 'Áudio' },
    { value: 'music', icon: Music, label: 'Música' },
    { value: 'call', icon: PhoneCall, label: 'Chamada' }
  ];

  const handleItemClick = (value: string) => {
    // Only update if the value is different
    if (value && value !== activeMode) {
      onChange(value as ChatMode);
    }
  };

  return (
    <ToggleGroup 
      type="single" 
      value={activeMode} 
      onValueChange={(value) => value && onChange(value as ChatMode)}
      className={cn(
        "flex items-center p-1 rounded-2xl bg-white/5 backdrop-blur-xl",
        "border border-white/10 gap-1 contain-layout contain-paint will-change-auto",
        isTouchDevice ? "min-h-[3rem]" : "",
        className
      )}
    >
      {modes.map(({ value, icon: Icon, label }) => (
        <ToggleGroupItem 
          key={value}
          value={value}
          aria-label={`${label} mode`}
          onClick={() => handleItemClick(value)}
          className={cn(
            "transition-all duration-200",
            "rounded-xl p-2.5 text-white/60",
            "data-[state=on]:bg-white/10 data-[state=on]:text-white",
            "data-[state=on]:shadow-inner data-[state=on]:shadow-white/5",
            isTouchDevice ? "min-w-[3rem] min-h-[2.75rem]" : "",
            isTouchDevice ? "touch-feedback" : "hover:bg-white/5",
          )}
          style={{ transformOrigin: 'center' }}
        >
          <Icon size={isTouchDevice ? 20 : 18} />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
};

// Add custom CSS for touch feedback with opacity change instead of scale
const touchFeedbackStyle = `
  .touch-feedback {
    position: relative;
    z-index: 1;
    isolation: isolate;
    contain: strict;
  }
  
  .touch-feedback:active {
    opacity: 0.7;
    transition: opacity 0.1s ease;
  }
`;

// Add the style to the document head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = touchFeedbackStyle;
  document.head.appendChild(style);
}

export default memo(RefinedModeSelector);
