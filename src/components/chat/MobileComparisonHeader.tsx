
import React from 'react';
import ModelSelector from '../ModelSelector';
import { ChatMode } from '@/components/ModeSelector';

interface MobileComparisonHeaderProps {
  comparing: boolean;
  isMobile: boolean;
  activeMode: ChatMode;
  leftModel: string;
  rightModel: string;
  availableModels: string[];
  onLeftModelChange: (model: string) => void;
  onRightModelChange: (model: string) => void;
}

const MobileComparisonHeader: React.FC<MobileComparisonHeaderProps> = ({
  comparing,
  isMobile,
  activeMode,
  leftModel,
  rightModel,
  availableModels,
  onLeftModelChange,
  onRightModelChange
}) => {
  if (!comparing || !isMobile) return null;
  
  return (
    <div className="sticky top-0 z-10 px-2 py-2 border-b border-inventu-gray/30 bg-inventu-dark/80 backdrop-blur-lg">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <ModelSelector 
              mode={activeMode}
              selectedModel={leftModel}
              onChange={onLeftModelChange}
              availableModels={availableModels}
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <ModelSelector 
              mode={activeMode}
              selectedModel={rightModel}
              onChange={onRightModelChange}
              availableModels={availableModels}
              className="w-full"
            />
          </div>
        </div>
        <div className="text-xs text-white/60 text-center">
          Comparando modelos ({leftModel} vs {rightModel})
        </div>
      </div>
    </div>
  );
};

export default MobileComparisonHeader;
