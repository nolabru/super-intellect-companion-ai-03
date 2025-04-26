
import React from 'react';
import ModeSelector, { ChatMode } from '@/components/ModeSelector';
import CompareModelsButton from '@/components/CompareModelsButton';
import LinkToggleButton from '@/components/LinkToggleButton';

interface ChatControlsProps {
  activeMode: ChatMode;
  comparing: boolean;
  isLinked: boolean;
  isMobile: boolean;
  onModeChange: (mode: ChatMode) => void;
  onToggleCompare: () => void;
  onToggleLink: () => void;
}

const ChatControls: React.FC<ChatControlsProps> = ({
  activeMode,
  comparing,
  isLinked,
  isMobile,
  onModeChange,
  onToggleCompare,
  onToggleLink
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2">
      <div className="flex flex-wrap items-center gap-2">
        <ModeSelector 
          activeMode={activeMode} 
          onChange={onModeChange} 
          className="min-w-[200px]"
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
  );
};

export default ChatControls;
