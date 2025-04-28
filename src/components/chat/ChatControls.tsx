
import React from 'react';
import { cn } from '@/lib/utils';
import { ChatMode } from '@/components/ModeSelector';
import RefinedModeSelector from './RefinedModeSelector';
import { Button } from '@/components/ui/button';
import { MessagesSquare } from 'lucide-react';
import ParameterSheet from './parameters/ParameterSheet';

interface ChatControlsProps {
  activeMode: ChatMode;
  comparing: boolean;
  isLinked: boolean;
  isMobile: boolean;
  model: string;
  onModeChange: (mode: ChatMode) => void;
  onToggleCompare: () => void;
  onToggleLink: () => void;
  onParamsChange: (params: any) => void;
}

const ChatControls: React.FC<ChatControlsProps> = ({
  activeMode,
  comparing,
  isMobile,
  model,
  onModeChange,
  onToggleCompare,
  onParamsChange
}) => {
  return (
    <div className="flex flex-col gap-3 p-3 bg-black/20 backdrop-blur-xl border-t border-white/5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <RefinedModeSelector 
            activeMode={activeMode} 
            onChange={onModeChange}
          />
          <Button
            onClick={onToggleCompare}
            size="icon"
            variant="ghost"
            className={cn(
              "rounded-full w-10 h-10",
              comparing 
                ? "bg-inventu-purple/20 text-inventu-purple hover:bg-inventu-purple/30" 
                : "bg-white/5 hover:bg-white/10"
            )}
          >
            <MessagesSquare className="h-5 w-5" />
          </Button>
        </div>
        
        {activeMode !== 'text' && (
          <ParameterSheet 
            mode={activeMode}
            model={model}
            onParamsChange={onParamsChange}
          />
        )}
      </div>
    </div>
  );
};

export default ChatControls;
