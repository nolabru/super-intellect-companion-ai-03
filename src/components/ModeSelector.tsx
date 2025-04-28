import React from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Text, Image, Video, AudioLines, PhoneCall } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ChatMode = 'text' | 'image' | 'video' | 'audio' | 'call';

interface ModeSelectorProps {
  activeMode: ChatMode;
  onChange: (mode: ChatMode) => void;
  className?: string;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ activeMode, onChange, className }) => {
  return (
    <ToggleGroup 
      type="single" 
      value={activeMode} 
      onValueChange={(value) => value && onChange(value as ChatMode)}
      className={cn("bg-inventu-card rounded-lg p-1", className)}
    >
      <ToggleGroupItem 
        value="text" 
        aria-label="Text mode"
        className={cn(
          "data-[state=on]:bg-inventu-gray data-[state=on]:text-white",
          "p-2 text-gray-400 hover:text-gray-200"
        )}
      >
        <Text size={18} />
      </ToggleGroupItem>
      
      <ToggleGroupItem 
        value="image" 
        aria-label="Image mode"
        className={cn(
          "data-[state=on]:bg-inventu-gray data-[state=on]:text-white",
          "p-2 text-gray-400 hover:text-gray-200"
        )}
      >
        <Image size={18} />
      </ToggleGroupItem>
      
      <ToggleGroupItem 
        value="video" 
        aria-label="Video mode"
        className={cn(
          "data-[state=on]:bg-inventu-gray data-[state=on]:text-white",
          "p-2 text-gray-400 hover:text-gray-200"
        )}
      >
        <Video size={18} />
      </ToggleGroupItem>
      
      <ToggleGroupItem 
        value="audio" 
        aria-label="Audio mode"
        className={cn(
          "data-[state=on]:bg-inventu-gray data-[state=on]:text-white",
          "p-2 text-gray-400 hover:text-gray-200"
        )}
      >
        <AudioLines size={18} />
      </ToggleGroupItem>
      
      <ToggleGroupItem 
        value="call" 
        aria-label="Call mode"
        className={cn(
          "data-[state=on]:bg-inventu-gray data-[state=on]:text-white",
          "p-2 text-gray-400 hover:text-gray-200"
        )}
      >
        <PhoneCall size={18} />
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

export default ModeSelector;
