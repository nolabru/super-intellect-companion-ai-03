
import React from 'react';
import { ChatMode } from './ModeSelector';
import { cn } from '@/lib/utils';
import ChatMessageContent from './chat/ChatMessageContent';
import MediaContainer from './chat/MediaContainer';
import MessageHeader from './chat/MessageHeader';
import MessageStatusIndicator from './chat/MessageStatusIndicator';
import { extractMediaUrl, cleanMessageContent } from '@/utils/mediaUtils';
import { getModelBubbleColor } from '@/utils/modelColors';

export interface MessageType {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  model?: string;
  mode?: ChatMode;
  loading?: boolean;
  error?: boolean;
  files?: string[];
  mediaUrl?: string;
  audioData?: string;
  streaming?: boolean;
}

interface ChatMessageProps {
  message: MessageType;
  highlightModel?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, highlightModel }) => {
  const isUser = message.sender === 'user';
  const isLoading = message.loading || message.id?.startsWith('loading-');
  const isVideo = message.mode === 'video';
  const isError = message.error;
  const isStreaming = message.streaming;

  const mediaUrl = React.useMemo(() => {
    if (message.mediaUrl) return message.mediaUrl;
    if (message.files && message.files.length > 0) return message.files[0];
    return extractMediaUrl(message.content);
  }, [message.mediaUrl, message.files, message.content]);

  const displayContent = React.useMemo(() => {
    return cleanMessageContent(message.content);
  }, [message.content]);
  
  return (
    <div className={cn(
      "flex flex-col mb-4 animate-fade-in transition-all duration-300",
      isUser ? "items-end" : "items-start"
    )}>
      <div className={cn(
        "chat-bubble group max-w-[85%]",
        isUser ? "user-bubble" : "ai-bubble",
        "break-words p-4 rounded-2xl",
        isUser 
          ? "bg-gradient-to-br from-blue-500/90 to-blue-600/90 text-white backdrop-blur-xl border border-white/10" 
          : `bg-gradient-to-br ${getModelBubbleColor(message.model || '')} text-white backdrop-blur-xl border border-white/10`,
        isLoading && !isVideo && "animate-pulse",
        isError && "bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30"
      )}>
        <MessageHeader 
          isUser={isUser}
          model={message.model}
          mode={message.mode}
        />
        
        <ChatMessageContent 
          content={displayContent}
          isLoading={isLoading && !isVideo}
          isError={isError}
          isStreaming={isStreaming}
        />
        
        <MessageStatusIndicator 
          isLoading={isLoading}
          isError={isError}
          isVideo={isVideo}
          model={message.model}
        />
        
        {mediaUrl && !isLoading && (message.mode === 'image' || message.mode === 'video' || message.mode === 'audio') && (
          <MediaContainer 
            mediaUrl={mediaUrl}
            mode={message.mode}
            prompt={message.content}
            modelId={message.model}
          />
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
