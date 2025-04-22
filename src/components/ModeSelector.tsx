
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
    text: <Text size={isMobile ? 18 : 20} strokeWidth={2} />,
    image: <Image size={isMobile ? 18 : 20} strokeWidth={2} />,
    video: <Video size={isMobile ? 18 : 20} strokeWidth={2} />,
    audio: <AudioLines size={isMobile ? 18 : 20} strokeWidth={2} />
  };

  return (
    <ToggleGroup
      type="single"
      value={activeMode}
      onValueChange={(value) => value && onChange(value as ChatMode)}
      className={cn("bg-inventu-dark/80 rounded-xl p-[0.12rem] shadow-sm gap-1", className)}
    >
      {(["text", "image", "video", "audio"] as ChatMode[]).map(mode => (
        <ToggleGroupItem
          key={mode}
          value={mode}
          aria-label={mode}
          className={cn(
            "mode-selector-btn",
            "rounded-lg p-1.5",
            "transition-all",
            activeMode === mode
              ? "bg-inventu-blue text-white shadow-sm"
              : "text-white/60 hover:bg-white/5 hover:text-white/80"
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
