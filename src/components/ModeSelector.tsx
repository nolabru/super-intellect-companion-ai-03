
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { Text, Image, Video, AudioLines, PhoneCall } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ChatMode = 'text' | 'image' | 'video' | 'audio' | 'call';

// Create a new function that's a re-export of our enhanced function
export const getModelsByMode = (mode: ChatMode) => {
  // Don't implement anything here - this function is now a compatibility layer
  // Our new implementation is in EnhancedModelSelector.tsx
  // This ensures existing code continues to work
  const { getEnhancedModelsByMode } = require('./EnhancedModelSelector');
  const modelsByProvider = getEnhancedModelsByMode(mode);
  return Object.values(modelsByProvider).flat();
};

interface ModeSelectorProps {
  activeMode: ChatMode;
  onChange: (mode: ChatMode) => void;
  className?: string;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ 
  activeMode, 
  onChange, 
  className 
}) => {
  const modes = [
    { value: 'text', icon: Text, label: 'Text' },
    { value: 'image', icon: Image, label: 'Image' },
    { value: 'video', icon: Video, label: 'Video' },
    { value: 'audio', icon: AudioLines, label: 'Audio' },
    { value: 'call', icon: PhoneCall, label: 'Call' }
  ];

  return (
    <ToggleGroup 
      type="single" 
      value={activeMode} 
      onValueChange={(value) => value && onChange(value as ChatMode)}
      className={cn("flex items-center", className)}
    >
      {modes.map(({ value, icon: Icon, label }) => (
        <ToggleGroupItem 
          key={value}
          value={value}
          aria-label={`${label} mode`}
          className="flex flex-col items-center gap-1 px-2 py-1 rounded-md"
          style={{ transformOrigin: 'center' }}
        >
          <Icon size={18} />
          <span className="text-xs">{label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
};

export default ModeSelector;
