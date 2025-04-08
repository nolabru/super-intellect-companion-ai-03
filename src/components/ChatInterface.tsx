
import React from 'react';
import ChatMessage, { MessageType } from './ChatMessage';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChatMode } from './ModeSelector';
import { Loader2 } from 'lucide-react';

interface ChatInterfaceProps {
  messages: MessageType[];
  model: string;
  className?: string;
  title: string;
  onModelChange?: (model: string) => void;
  availableModels?: string[];
  isCompareMode?: boolean;
  loading?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  model, 
  className, 
  title,
  onModelChange,
  availableModels = [],
  isCompareMode = false,
  loading = false
}) => {
  const filteredMessages = messages.filter(msg => 
    msg.sender === 'user' || 
    msg.model === model || 
    (msg.id && msg.id.startsWith('loading-') && msg.model === model)
  );
  
  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className={cn(
        "p-2 text-center flex justify-center items-center",
        model.includes('gpt') || model.includes('llama') ? "text-inventu-blue" : "text-inventu-purple"
      )}>
        {/* Model selector in the header */}
        <Select value={model} onValueChange={onModelChange || (() => {})}>
          <SelectTrigger className="w-48 bg-inventu-card text-white border-inventu-gray/30 font-bold">
            <SelectValue placeholder={title} />
          </SelectTrigger>
          <SelectContent>
            {availableModels.map(modelOption => (
              <SelectItem key={modelOption} value={modelOption}>
                {modelOption}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
        {loading && filteredMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <Loader2 className="h-8 w-8 mr-2 animate-spin" />
            <span>Carregando mensagens...</span>
          </div>
        ) : filteredMessages.length > 0 ? (
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
