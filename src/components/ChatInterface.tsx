
import React from 'react';
import ChatMessage, { MessageType } from './ChatMessage';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { AVAILABLE_MODELS } from './ModelSelector';

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
  
  // Encontrar o displayName do modelo atual para exibição
  const getModelDisplayName = (modelId: string) => {
    const modelInfo = AVAILABLE_MODELS.find(m => m.id === modelId);
    return modelInfo?.displayName || modelId;
  };

  // Determinando a cor do modelo com base no provedor
  const getModelColor = (modelId: string) => {
    const modelInfo = AVAILABLE_MODELS.find(m => m.id === modelId);
    if (!modelInfo) return "text-inventu-blue";
    
    switch (modelInfo.provider) {
      case 'openai':
        return "text-inventu-blue";
      case 'anthropic':
        return "text-inventu-purple";
      case 'google':
        return "text-green-500";
      case 'kligin':
        return "text-orange-500";
      case 'ideogram':
        return "text-yellow-500";
      case 'minimax':
        return "text-pink-500";
      case 'elevenlabs':
        return "text-cyan-500";
      default:
        return "text-inventu-blue";
    }
  };
  
  // Verificar se há mensagens de carregamento de vídeo
  const hasVideoLoadingMessage = filteredMessages.some(msg => 
    msg.id?.startsWith('loading-') && 
    msg.mode === 'video' && 
    msg.model === model
  );
  
  // Obter a mensagem de carregamento de vídeo (se existir)
  const videoLoadingMessage = filteredMessages.find(msg => 
    msg.id?.startsWith('loading-') && 
    msg.mode === 'video' && 
    msg.model === model
  );
  
  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className={cn(
        "p-2 text-center flex justify-center items-center",
        getModelColor(model)
      )}>
        {/* Model selector in the header */}
        <Select value={model} onValueChange={onModelChange || (() => {})}>
          <SelectTrigger className="w-48 bg-inventu-card text-white border-inventu-gray/30 font-bold">
            <SelectValue placeholder={getModelDisplayName(model)} />
          </SelectTrigger>
          <SelectContent>
            {availableModels.map(modelOption => {
              const displayName = getModelDisplayName(modelOption);
              return (
                <SelectItem key={modelOption} value={modelOption}>
                  {displayName}
                </SelectItem>
              );
            })}
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
          <>
            {filteredMessages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            
            {/* Informação adicional para geração de vídeo */}
            {hasVideoLoadingMessage && (
              <div className="text-center p-3 bg-inventu-darker/20 rounded-lg my-4 text-gray-300">
                <p className="text-sm">A geração de vídeo pode levar até 3 minutos para ser concluída.</p>
                <p className="text-xs mt-1 text-gray-400">O sistema está processando seu pedido. Por favor, aguarde.</p>
                {videoLoadingMessage?.content && videoLoadingMessage.content.includes("processamento") && (
                  <div className="mt-2 flex justify-center">
                    <div className="bg-inventu-blue/20 px-3 py-1 rounded-full text-xs flex items-center">
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      <span>Processando vídeo...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
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
