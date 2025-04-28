
import React, { memo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import RefinedModeSelector from './RefinedModeSelector';
import CompareModelsButton from '../CompareModelsButton';
import LinkToggleButton from '../LinkToggleButton';
import ParametersManager from './parameters/ParametersManager';
import { ChatMode } from '../ModeSelector';

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
    <div className="px-3 py-3 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <RefinedModeSelector 
            activeMode={activeMode} 
            onChange={onModeChange} 
          />
          
          {activeMode !== 'text' && (
            <ParametersManager
              mode={activeMode}
              model={model}
              onParamsChange={onParamsChange}
              variant="icon"
              className="flex-shrink-0"
            />
          )}
        </div>

        <div className="flex items-center gap-2">
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
