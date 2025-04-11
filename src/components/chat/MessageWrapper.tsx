
import React from 'react';
import { cn } from '@/lib/utils';
import { MessageType } from '@/components/ChatMessage';
import ModeIcon from './ModeIcon';

interface MessageWrapperProps {
  message: MessageType;
  children: React.ReactNode;
}

const MessageWrapper: React.FC<MessageWrapperProps> = ({ 
  message, 
  children 
}) => {
  const isUser = message.sender === 'user';
  
  return (
    <div className={cn(
      "flex flex-col mb-4 animate-fade-in",
      isUser ? "items-end" : "items-start"
    )}>
      <div className="flex items-center mb-1 text-sm text-gray-400">
        {!isUser && (
          <span className="font-medium mr-2">
            {message.model}
          </span>
        )}
        {isUser && <span className="font-medium mr-2">Você</span>}
        <div className="flex items-center mr-2">
          <ModeIcon mode={message.mode} />
          <span className="capitalize">{message.mode || 'text'}</span>
        </div>
        <span>{message.timestamp}</span>
      </div>
      
      <div className={cn(
        "chat-bubble max-w-[80%] transition-all duration-200",
        isUser ? "user-bubble hover:shadow-lg" : "ai-bubble hover:shadow-lg",
        isUser ? "hover:bg-inventu-blue/95" : "hover:bg-inventu-card/95"
      )}>
        {children}
      </div>
    </div>
  );
};

export default MessageWrapper;
