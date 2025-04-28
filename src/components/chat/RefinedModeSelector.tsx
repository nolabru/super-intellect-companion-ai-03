
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Text, Image, Video, AudioLines } from 'lucide-react';
import { ChatMode } from '../ModeSelector';
import { cn } from '@/lib/utils';

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
  return (
    <ToggleGroup 
      type="single" 
      value={activeMode} 
      onValueChange={(value) => value && onChange(value as ChatMode)}
      className={cn(
        "flex items-center p-1 rounded-2xl bg-white/5 backdrop-blur-xl",
        "border border-white/10 gap-1",
        className
      )}
    >
      {[
        { value: 'text', icon: Text },
        { value: 'image', icon: Image },
        { value: 'video', icon: Video },
        { value: 'audio', icon: AudioLines }
      ].map(({ value, icon: Icon }) => (
        <ToggleGroupItem 
          key={value}
          value={value}
          aria-label={`${value} mode`}
          className={cn(
            "transition-all duration-200 data-[state=on]:scale-100",
            "rounded-xl p-2.5 text-white/60",
            "data-[state=on]:bg-white/10 data-[state=on]:text-white",
            "data-[state=on]:shadow-inner data-[state=on]:shadow-white/5",
            "touch-feedback active:scale-95"
          )}
        >
          <Icon size={18} />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
};

export default RefinedModeSelector;
