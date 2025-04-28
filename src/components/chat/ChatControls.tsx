
import React from 'react';
import { cn } from '@/lib/utils';
import { ChatMode } from '@/components/ModeSelector';
import RefinedModeSelector from './RefinedModeSelector';
import CompareModelsButton from '@/components/CompareModelsButton';
import LinkToggleButton from '@/components/LinkToggleButton';
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
  isLinked,
  isMobile,
  model,
  onModeChange,
  onToggleCompare,
  onToggleLink,
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
          {!isMobile && (
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
          )}
        </div>
        <ParameterSheet 
          mode={activeMode}
          model={model}
          onParamsChange={onParamsChange}
        />
      </div>
    </div>
  );
};

export default ChatControls;
