
import React, { memo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import RefinedModeSelector from './RefinedModeSelector';
import CompareModelsButton from '../CompareModelsButton';
import LinkToggleButton from '../LinkToggleButton';
import ParametersManager from './parameters/ParametersManager';
import TokenDisplay from '../TokenDisplay';
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <RefinedModeSelector 
            activeMode={activeMode} 
            onChange={onModeChange} 
          />
          
          {activeMode !== 'text' && (
            <ParametersManager
              mode={activeMode}
              model={model}
              onParamsChange={onParamsChange}
              variant={isMobile ? "icon" : "button"}
              className="flex-shrink-0"
            />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Show token display on all screens */}
          <TokenDisplay />
          
          {/* Comparison controls for desktop */}
          {!isMobile && (
            <div className="flex items-center gap-2">
              <CompareModelsButton 
                isComparing={comparing} 
                onToggleCompare={onToggleCompare} 
              />
              
              {comparing && (
                <LinkToggleButton 
                  isLinked={isLinked} 
                  onToggleLink={onToggleLink} 
                  disabled={isMobile}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Export a memoized version to prevent unnecessary re-renders
export default memo(ChatControls);
