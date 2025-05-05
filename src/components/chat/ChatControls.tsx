
import React, { memo } from 'react';
import RefinedModeSelector from './RefinedModeSelector';
import CompareModelsButton from '../CompareModelsButton';
import LinkToggleButton from '../LinkToggleButton';
import ParametersManager from './parameters/ParametersManager';
import { ChatMode } from '../ModeSelector';
import { cn } from '@/lib/utils';

interface ChatControlsProps {
  mode: ChatMode;
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
  mode,
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
      "px-4 py-3 space-y-3 backdrop-blur-xl bg-black/5 border-t border-white/10",
      "contain-layout contain-paint transform-gpu will-change-auto"
    )}>
      <div className="flex items-center justify-between gap-3">
        <div className={cn(
          "flex items-center gap-3 transform-gpu",
          "contain-layout contain-paint"
        )}>
          <RefinedModeSelector 
            activeMode={mode} 
            onChange={onModeChange} 
          />
          
          {mode !== 'text' && (
            <ParametersManager
              mode={mode}
              model={model}
              onParamsChange={onParamsChange}
              variant="icon"
              className="flex-shrink-0"
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <CompareModelsButton 
            isComparing={comparing} 
            onToggleCompare={onToggleCompare} 
          />
          
          {comparing && !isMobile && (
            <LinkToggleButton 
              isLinked={isLinked} 
              onToggleLink={onToggleLink} 
              disabled={isMobile}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(ChatControls);
