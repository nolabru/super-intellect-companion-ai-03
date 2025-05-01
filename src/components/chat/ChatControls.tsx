
import React, { memo } from 'react';
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
  // Prevent default to avoid any container movement
  const handleModeChange = (mode: ChatMode) => {
    // Prevent default browser behavior that might cause layout shifts
    onModeChange(mode);
  };

  return (
    <div className="px-4 py-3 space-y-3 backdrop-blur-xl bg-black/5 border-t border-white/10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <RefinedModeSelector 
            activeMode={activeMode} 
            onChange={handleModeChange}
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
