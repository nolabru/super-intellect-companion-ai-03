
import React from 'react';
import RefinedModeSelector from './RefinedModeSelector';
import { ChatMode } from '@/components/ModeSelector';
import CompareModelsButton from '@/components/CompareModelsButton';
import LinkToggleButton from '@/components/LinkToggleButton';
import { cn } from '@/lib/utils';

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
    <div className={cn(
      "flex flex-wrap items-center justify-between gap-3 p-3",
      "bg-black/20 backdrop-blur-xl border-t border-white/5"
    )}>
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
  );
};

export default ChatControls;
