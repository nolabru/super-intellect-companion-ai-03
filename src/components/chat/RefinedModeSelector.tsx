
import React, { memo } from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Text, Image, Video, AudioLines, PhoneCall } from 'lucide-react';
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
    { value: 'call', icon: PhoneCall, label: 'Chamada' }
  ];

  return (
    <ToggleGroup 
      type="single" 
      value={activeMode} 
      onValueChange={(value) => value && onChange(value as ChatMode)}
      className={cn(
        "flex items-center p-1 rounded-2xl bg-white/5 backdrop-blur-xl",
        "border border-white/10 gap-1",
        isTouchDevice ? "min-h-[3rem]" : "",
        className
      )}
    >
      {modes.map(({ value, icon: Icon, label }) => (
        <ToggleGroupItem 
          key={value}
          value={value}
          aria-label={`${label} mode`}
          className={cn(
            "transition-all duration-200",
            "rounded-xl p-2.5 text-white/60",
            "data-[state=on]:bg-white/10 data-[state=on]:text-white",
            "data-[state=on]:shadow-inner data-[state=on]:shadow-white/5",
            isTouchDevice ? "min-w-[3rem] min-h-[2.75rem] active:scale-95" : "",
            isTouchDevice ? "touch-ripple" : "hover:bg-white/5",
          )}
        >
          <Icon size={isTouchDevice ? 20 : 18} />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
};

// Add custom CSS class for touch feedback
const touchRippleStyle = `
  .touch-ripple {
    position: relative;
    overflow: hidden;
  }
  
  .touch-ripple::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%);
    opacity: 0;
    top: 0;
    left: 0;
    transform: scale(2);
    transition: opacity 0.5s, transform 0.5s;
  }
  
  .touch-ripple:active::after {
    opacity: 0.3;
    transform: scale(0);
    transition: 0s;
  }
`;

// Add the style to the document head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = touchRippleStyle;
  document.head.appendChild(style);
}

export default memo(RefinedModeSelector);
