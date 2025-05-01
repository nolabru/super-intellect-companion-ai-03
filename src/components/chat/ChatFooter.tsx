
import React from 'react';
import { cn } from '@/lib/utils';
import { ChatMode } from '@/components/ModeSelector';
import ChatInput from '../ChatInput';
import ChatControls from './ChatControls';

interface ChatFooterProps {
  activeMode: ChatMode;
  comparing: boolean;
  isLinked: boolean;
  isMobile: boolean;
  leftModel: string;
  rightModel: string;
  onModeChange: (mode: ChatMode) => void;
  onToggleCompare: () => void;
  onToggleLink: () => void;
  onParamsChange: (params: any) => void;
  onSendMessage: (content: string, files?: string[], params?: any, targetModel?: string) => void;
}

const ChatFooter: React.FC<ChatFooterProps> = ({
  activeMode,
  comparing,
  isLinked,
  isMobile,
  leftModel,
  rightModel,
  onModeChange,
  onToggleCompare,
  onToggleLink,
  onParamsChange,
  onSendMessage
}) => {
  return (
    <div className={cn(
      "sticky bottom-0 z-30 border-t border-inventu-gray/30",
      "bg-inventu-dark/95 backdrop-blur-lg",
      "contain-layout transform-gpu will-change-transform"
    )}>
      <ChatControls
        activeMode={activeMode}
        comparing={comparing}
        isLinked={isLinked}
        isMobile={isMobile}
        model={comparing ? `${leftModel},${rightModel}` : leftModel}
        onModeChange={onModeChange}
        onToggleCompare={onToggleCompare}
        onToggleLink={onToggleLink}
        onParamsChange={onParamsChange}
      />
      
      {(!comparing || isLinked || isMobile) && (
        <div className={cn(
          "px-2 mb-1 transform-gpu contain-layout",
          isMobile ? "pb-6" : "pb-2" // Extra padding on mobile for better touch area
        )}>
          <ChatInput 
            onSendMessage={onSendMessage} 
            mode={activeMode}
            model={comparing ? `${leftModel} e ${rightModel}` : leftModel}
          />
        </div>
      )}
    </div>
  );
};

export default ChatFooter;
