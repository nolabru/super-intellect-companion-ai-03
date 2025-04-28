
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
    <div className="px-3 py-3 flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex-1 flex items-center justify-between gap-2">
        <RefinedModeSelector 
          activeMode={activeMode} 
          onChange={onModeChange} 
        />
        
        {/* Only show on desktop */}
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
      
      {activeMode !== 'text' && (
        <ParametersManager
          mode={activeMode}
          model={model}
          onParamsChange={onParamsChange}
          variant={isMobile ? "icon" : "button"}
          className={isMobile ? "flex justify-end" : "w-full md:w-auto md:min-w-[200px]"}
        />
      )}
    </div>
  );
};

// Export a memoized version to prevent unnecessary re-renders
export default memo(ChatControls);
