
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Text, Image, Video, AudioLines } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ChatMode = 'text' | 'image' | 'video' | 'audio';

interface ModeSelectorProps {
  activeMode: ChatMode;
  onChange: (mode: ChatMode) => void;
  className?: string;
}

const icons = {
  text: <Text size={28} strokeWidth={2.2} />,
  image: <Image size={28} strokeWidth={2.2} />,
  video: <Video size={28} strokeWidth={2.2} />,
  audio: <AudioLines size={28} strokeWidth={2.2} />
};

const labels = {
  text: "Texto",
  image: "Imagem",
  video: "Vídeo",
  audio: "Áudio"
};

const ModeSelector: React.FC<ModeSelectorProps> = ({ activeMode, onChange, className }) => {
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
          aria-label={labels[mode]}
          className={cn(
            "mode-selector-btn",
            "rounded-2xl p-2",
            "transition-colors",
            activeMode === mode
              ? "bg-inventu-blue/90 text-white shadow-lg ring-2 ring-inventu-blue"
              : "text-inventu-gray/80 hover:bg-black/10"
          )}
          title={labels[mode]}
        >
          {icons[mode]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
};
export default ModeSelector;
