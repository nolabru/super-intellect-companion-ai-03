
import React from 'react';
import { cn } from '@/lib/utils';

export type MessageType = {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  model: 'gpt4' | 'claude' | string;
  timestamp: string;
};

interface ChatMessageProps {
  message: MessageType;
  className?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, className }) => {
  const isUser = message.sender === 'user';
  
  return (
    <div className={cn(
      "flex flex-col mb-4 animate-fade-in",
      isUser ? "items-end" : "items-start",
      className
    )}>
      <div className="flex items-center mb-1 text-sm text-gray-400">
        {!isUser && (
          <span className="font-medium mr-2">
            {message.model === 'gpt4' ? 'GPT-4' : 'Claude'}
          </span>
        )}
        {isUser && <span className="font-medium mr-2">Você</span>}
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
