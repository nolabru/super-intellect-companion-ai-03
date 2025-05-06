
import React, { memo } from 'react';
import RefinedModeSelector from './RefinedModeSelector';
import CompareModelsButton from '../CompareModelsButton';
import LinkToggleButton from '../LinkToggleButton';
import ModelSelector from '../ModelSelector';
import { ChatMode } from '../ModeSelector';
import { cn } from '@/lib/utils';

interface ChatControlsProps {
  activeMode: ChatMode;
  comparing: boolean;
  isLinked: boolean;
  isMobile: boolean;
  model: string;
  onModeChange: (mode: ChatMode) => void;
  onToggleCompare: () => void;
  onToggleLink: () => void;
  onModelChange: (model: string) => void;
  availableModels?: string[];
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
  onModelChange,
  availableModels
}) => {
  // Separar os modelos se estamos comparando
  const modelIds = model.split(',');
  const leftModel = modelIds[0] || '';
  
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
            activeMode={activeMode} 
            onChange={onModeChange} 
          />
          
          {/* Seletor de modelo movido para cima */}
          {availableModels && availableModels.length > 0 && (
            <ModelSelector
              mode={activeMode}
              selectedModel={leftModel}
              onChange={onModelChange}
              availableModels={availableModels}
              className="max-w-48"
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
