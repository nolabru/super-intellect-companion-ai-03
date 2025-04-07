
import React from 'react';
import ChatMessage, { MessageType } from './ChatMessage';
import { cn } from '@/lib/utils';

interface ChatInterfaceProps {
  messages: MessageType[];
  model: string;
  className?: string;
  title: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, model, className, title }) => {
  const filteredMessages = messages.filter(msg => msg.sender === 'user' || msg.model === model);
  
  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className={cn(
        "text-xl font-bold mb-4 p-2 text-center",
        model.includes('gpt') || model.includes('llama') ? "text-inventu-blue" : "text-inventu-purple"
      )}>
        {title}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Nenhuma mensagem ainda. Comece uma conversa!
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
