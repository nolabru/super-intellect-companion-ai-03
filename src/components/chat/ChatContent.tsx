
import React from 'react';
import { cn } from '@/lib/utils';
import { MessageType } from '@/components/ChatMessage';
import { ChatMode } from '@/components/ModeSelector';
import ComparisonView from '@/components/chat/ComparisonView';
import SingleChatView from '@/components/chat/SingleChatView';
import MobileComparisonHeader from './MobileComparisonHeader';

interface ChatContentProps {
  comparing: boolean;
  isLinked: boolean;
  activeMode: ChatMode;
  leftModel: string;
  rightModel: string;
  messages: MessageType[];
  availableModels: string[];
  isMobile: boolean;
  loading: boolean;
  initialLoadDone: boolean;
  handleLeftModelChange: (model: string) => void;
  handleRightModelChange: (model: string) => void;
  handleSendMessage: (content: string, files?: string[], params?: any, targetModel?: string) => void;
}

const ChatContent: React.FC<ChatContentProps> = ({
  comparing,
  isLinked,
  activeMode,
  leftModel,
  rightModel,
  messages,
  availableModels,
  isMobile,
  loading,
  initialLoadDone,
  handleLeftModelChange,
  handleRightModelChange,
  handleSendMessage
}) => {
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <MobileComparisonHeader
        comparing={comparing}
        isMobile={isMobile}
        activeMode={activeMode}
        leftModel={leftModel}
        rightModel={rightModel}
        availableModels={availableModels}
        onLeftModelChange={handleLeftModelChange}
        onRightModelChange={handleRightModelChange}
      />

      <div className={cn(
        "flex-1 flex flex-col md:flex-row overflow-hidden relative min-h-0",
        "bg-inventu-dark",
        "md:rounded-xl md:mx-4 md:my-2",
        isMobile ? "mx-0 my-0" : ""
      )}>
        {comparing ? (
          <ComparisonView
            messages={messages}
            leftModel={leftModel}
            rightModel={rightModel}
            activeMode={activeMode}
            isLinked={isLinked}
            availableModels={availableModels}
            isMobile={isMobile}
            loading={loading}
            initialLoadDone={initialLoadDone}
            handleLeftModelChange={handleLeftModelChange}
            handleRightModelChange={handleRightModelChange}
            handleSendMessage={handleSendMessage}
          />
        ) : (
          <SingleChatView
            messages={messages}
            model={leftModel}
            availableModels={availableModels}
            onModelChange={handleLeftModelChange}
            loading={loading}
            initialLoadDone={initialLoadDone}
          />
        )}
      </div>
    </div>
  );
};

export default ChatContent;
