
import React from 'react';
import { cn } from '@/lib/utils';
import { MessageType } from './ChatMessage';
import ChatMessage from './ChatMessage';
import ModelSelector from './ModelSelector';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

interface ChatInterfaceProps {
  messages: MessageType[];
  model: string;
  title?: string;
  onModelChange?: (model: string) => void;
  availableModels?: string[];
  isCompareMode?: boolean;
  loading?: boolean;
  hideModelSelector?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  model,
  title,
  onModelChange,
  availableModels,
  isCompareMode = false,
  loading = false,
  hideModelSelector = false,
}) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const displayTitle = title || model;

  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const filteredMessages = isCompareMode
    ? messages.filter(msg => msg.sender === 'user' || msg.model === model)
    : messages;

  return (
    <div className="flex-1 flex flex-col h-full">
      {!hideModelSelector && (
        <div className="flex items-center justify-between p-2 border-b border-inventu-gray/30">
          {onModelChange && availableModels ? (
            <ModelSelector
              mode="text" // Este valor será substituído internamente
              selectedModel={model}
              onChange={onModelChange}
              availableModels={availableModels}
            />
          ) : (
            <div className="text-white font-medium">{displayTitle}</div>
          )}
        </div>
      )}
      
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
          </div>
        ) : filteredMessages.length > 0 ? (
          <div className="space-y-4">
            {filteredMessages.map(message => (
              <ChatMessage
                key={message.id}
                message={message}
                highlightModel={isCompareMode ? model : undefined}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-white/60">
            <div className="w-16 h-16 rounded-full bg-inventu-darker flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Nenhuma mensagem ainda</h3>
            <p className="text-sm max-w-md">
              Inicie uma conversa enviando uma mensagem abaixo
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ChatInterface;
