
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
    text: <Text size={isMobile ? 16 : 18} strokeWidth={2} />,
    image: <Image size={isMobile ? 16 : 18} strokeWidth={2} />,
    video: <Video size={isMobile ? 16 : 18} strokeWidth={2} />,
    audio: <AudioLines size={isMobile ? 16 : 18} strokeWidth={2} />
  };

  return (
    <ToggleGroup
      type="single"
      value={activeMode}
      onValueChange={(value) => value && onChange(value as ChatMode)}
      className={cn(
        "bg-inventu-dark/70 rounded-full p-[2px] shadow-sm ring-1 ring-inventu-blue/10 gap-1 transition-all",
        "backdrop-blur-xl flex",
        className
      )}
    >
      {(["text", "image", "video", "audio"] as ChatMode[]).map(mode => (
        <ToggleGroupItem
          key={mode}
          value={mode}
          aria-label={mode}
          className={cn(
            "rounded-full p-1.5 flex items-center justify-center min-w-0",
            "transition-colors duration-150 select-none outline-none focus:ring-inventu-blue/50",
            activeMode === mode
              ? "bg-inventu-blue text-white shadow-sm"
              : "text-inventu-blue/70 hover:bg-inventu-blue/10 hover:text-inventu-blue"
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
