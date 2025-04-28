
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
    <div className="p-1 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
      <ToggleGroup 
        type="single" 
        value={activeMode} 
        onValueChange={(value) => value && onChange(value as ChatMode)}
        className={cn(
          "flex items-center gap-1 p-0.5",
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
              "transition-all duration-200 data-[state=on]:scale-105",
              "rounded-lg p-2.5 text-white/60 hover:text-white",
              "data-[state=on]:bg-white/10 data-[state=on]:text-white",
              "data-[state=on]:shadow-inner data-[state=on]:shadow-white/5"
            )}
          >
            <Icon size={18} />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};

export default RefinedModeSelector;
