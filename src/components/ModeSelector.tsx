
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
    text: <Text size={isMobile ? 20 : 22} strokeWidth={2.1} />,
    image: <Image size={isMobile ? 20 : 22} strokeWidth={2.1} />,
    video: <Video size={isMobile ? 20 : 22} strokeWidth={2.1} />,
    audio: <AudioLines size={isMobile ? 20 : 22} strokeWidth={2.1} />
  };

  return (
    <ToggleGroup
      type="single"
      value={activeMode}
      onValueChange={(value) => value && onChange(value as ChatMode)}
      className={cn(
        "bg-inventu-dark/90 rounded-2xl p-0.5 shadow ring-1 ring-inventu-blue/10 gap-2 transition-all",
        "backdrop-blur-xl flex",
        isMobile ? "min-w-full" : "min-w-[210px]",
        className
      )}
    >
      {(["text", "image", "video", "audio"] as ChatMode[]).map(mode => (
        <ToggleGroupItem
          key={mode}
          value={mode}
          aria-label={mode}
          className={cn(
            "mode-selector-btn rounded-xl px-3 py-2 flex items-center justify-center min-w-[44px]",
            "font-medium transition-colors duration-150 select-none outline-none focus:ring-inventu-blue/50",
            activeMode === mode
              ? "bg-inventu-blue text-white shadow ring-2 ring-inventu-blue/30 scale-105"
              : "text-inventu-blue/70 hover:bg-inventu-blue/10 hover:text-inventu-blue active:scale-95"
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
