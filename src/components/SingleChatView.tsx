
import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import ChatControls from './chat/ChatControls';
import ChatContent from './chat/ChatContent';
import ChatFooter from './chat/ChatFooter';
import { ChatMode } from './ModeSelector';
import { GenerationParameters } from '@/types/parameters';
import { Chat } from '@/types/chat';

interface SingleChatViewProps {
  mode: ChatMode;
  model: string;
  onModelChange: (model: string) => void;
  onModeChange: (mode: ChatMode) => void;
  onToggleSidebar: () => void;
  onClearChat?: () => void;
  params?: GenerationParameters;
  onParamsChange?: (params: GenerationParameters) => void;
  onSendMessage: (message: string, files?: string[]) => void;
  chat: Chat;
  isTyping?: boolean;
  className?: string;
}

const SingleChatView: React.FC<SingleChatViewProps> = ({
  mode,
  model,
  onModelChange,
  onModeChange,
  onToggleSidebar,
  onClearChat,
  params,
  onParamsChange,
  onSendMessage,
  chat,
  isTyping = false,
  className = ''
}) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={cn("flex flex-col h-full relative", className)}>
      <div className="flex-none p-2 sm:px-4 sm:py-3">
        <ChatControls
          mode={mode}
          model={model}
          onModelChange={onModelChange}
          onModeChange={onModeChange}
          onToggleSidebar={onToggleSidebar}
          onClearChat={onClearChat}
          params={params}
          onParamsChange={onParamsChange}
        />
      </div>
      
      <div className="flex-grow overflow-hidden relative">
        <ChatContent
          messages={chat.messages}
          isTyping={isTyping}
          mode={mode}
        />
      </div>
      
      <div className="flex-none p-2 sm:p-4">
        <ChatFooter
          onSendMessage={onSendMessage}
          mode={mode}
          model={model}
        />
      </div>
    </div>
  );
};

export default SingleChatView;
