
import React from 'react';
import RefinedModeSelector from './RefinedModeSelector';
import { ChatMode } from '@/components/ModeSelector';
import CompareModelsButton from '@/components/CompareModelsButton';
import LinkToggleButton from '@/components/LinkToggleButton';
import { cn } from '@/lib/utils';
import ParameterControls from './parameters/ParameterControls';

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
  isLinked,
  isMobile,
  model,
  onModeChange,
  onToggleCompare,
  onToggleLink,
  onParamsChange
}) => {
  return (
    <div className={cn(
      "flex flex-col gap-3 p-3",
      "bg-black/20 backdrop-blur-xl border-t border-white/5"
    )}>
      <ParameterControls 
        mode={activeMode}
        model={model}
        onParamsChange={onParamsChange}
      />
      
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <RefinedModeSelector 
            activeMode={activeMode} 
            onChange={onModeChange}
          />
          <div className="flex items-center gap-2">
            <CompareModelsButton 
              isComparing={comparing} 
              onToggleCompare={onToggleCompare} 
            />
            {comparing && !isMobile && (
              <LinkToggleButton 
                isLinked={isLinked} 
                onToggleLink={onToggleLink} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatControls;
