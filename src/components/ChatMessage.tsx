
import React from 'react';
import { cn } from '@/lib/utils';
import { ChatMode } from './ModeSelector';
import { Image, Video, AudioLines, Text } from 'lucide-react';

export type MessageType = {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  model: string;
  timestamp: string;
  mode?: ChatMode;
};

interface ChatMessageProps {
  message: MessageType;
  className?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, className }) => {
  const isUser = message.sender === 'user';
  
  const renderModeIcon = () => {
    switch (message.mode) {
      case 'image':
        return <Image size={14} className="mr-1" />;
      case 'video':
        return <Video size={14} className="mr-1" />;
      case 'audio':
        return <AudioLines size={14} className="mr-1" />;
      case 'text':
      default:
        return <Text size={14} className="mr-1" />;
    }
  };
  
  return (
    <div className={cn(
      "flex flex-col mb-4 animate-fade-in",
      isUser ? "items-end" : "items-start",
      className
    )}>
      <div className="flex items-center mb-1 text-sm text-gray-400">
        {!isUser && (
          <span className="font-medium mr-2">
            {message.model}
          </span>
        )}
        {isUser && <span className="font-medium mr-2">Você</span>}
        <div className="flex items-center mr-2">
          {renderModeIcon()}
          <span className="capitalize">{message.mode || 'text'}</span>
        </div>
        <span>{message.timestamp}</span>
      </div>
      <div className={cn(
        "chat-bubble",
        isUser ? "user-bubble" : "ai-bubble",
        "break-words"
      )}>
        {message.content}
      </div>
    </div>
  );
};

export default ChatMessage;
