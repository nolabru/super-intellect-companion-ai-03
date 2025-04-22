
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Text, Image, Video, AudioLines } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export type ChatMode = 'text' | 'image' | 'video' | 'audio';

interface ModeSelectorProps {
  activeMode: ChatMode;
  onChange: (mode: ChatMode) => void;
  className?: string;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ activeMode, onChange, className }) => {
  const isMobile = useIsMobile();
  
  const icons = {
    text: <Text size={isMobile ? 20 : 24} strokeWidth={2.2} />,
    image: <Image size={isMobile ? 20 : 24} strokeWidth={2.2} />,
    video: <Video size={isMobile ? 20 : 24} strokeWidth={2.2} />,
    audio: <AudioLines size={isMobile ? 20 : 24} strokeWidth={2.2} />
  };

  return (
    <ToggleGroup
      type="single"
      value={activeMode}
      onValueChange={(value) => value && onChange(value as ChatMode)}
      className={cn("bg-card/80 rounded-xl p-[0.12rem] shadow-inner gap-1", className)}
    >
      {(["text", "image", "video", "audio"] as ChatMode[]).map(mode => (
        <ToggleGroupItem
          key={mode}
          value={mode}
          aria-label={mode}
          className={cn(
            "mode-selector-btn",
            "rounded-xl p-1.5",
            "transition-colors",
            activeMode === mode
              ? "bg-inventu-blue/90 text-white shadow-sm ring-1 ring-inventu-blue"
              : "text-inventu-gray/80 hover:bg-black/10"
          )}
          title={mode}
        >
          {icons[mode]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
};

export default ModeSelector;
