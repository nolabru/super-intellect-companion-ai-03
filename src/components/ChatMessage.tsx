import React from 'react';
import { ChatMode } from './ModeSelector';

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
}

interface ChatMessageProps {
  message: MessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const isLoading = message.loading || message.id?.startsWith('loading-');
  const isVideo = message.mode === 'video';
  
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

  // Verificar se a mensagem contém uma URL de mídia embutida
  const hasEmbeddedMedia = message.content.includes('[Imagem gerada]:') || 
                           message.content.includes('[Vídeo gerado]:') ||
                           message.content.includes('[Áudio gerado]');
  
  // Extrair URL da mídia se estiver embutida no conteúdo
  const extractMediaUrl = (content: string): string | null => {
    if (content.includes('[Imagem gerada]:') || content.includes('[Vídeo gerado]:')) {
      const match = content.match(/\]\: (https?:\/\/[^\s]+)/);
      return match ? match[1] : null;
    }
    return null;
  };

  // Limpar o conteúdo da mensagem de marcações de mídia
  const cleanContent = (content: string): string => {
    return content
      .replace(/\[Imagem gerada\]\: https?:\/\/[^\s]+/, '')
      .replace(/\[Vídeo gerado\]\: https?:\/\/[^\s]+/, '')
      .replace(/\[Áudio gerado\]/, '')
      .trim();
  };

  // Determinar URL da mídia (da propriedade ou embutida no conteúdo)
  const mediaUrl = message.mediaUrl || (hasEmbeddedMedia ? extractMediaUrl(message.content) : null);
  
  // Conteúdo limpo para exibição
  const displayContent = hasEmbeddedMedia ? cleanContent(message.content) : message.content;
  
  // Renderizar um indicador de carregamento de vídeo personalizado
  const renderVideoLoading = () => {
    if (isLoading && isVideo) {
      return (
        <div className="flex flex-col items-center justify-center p-4 my-2 bg-inventu-darker/20 rounded-lg">
          <Loader2 className="h-10 w-10 mb-2 animate-spin text-inventu-gray" />
          <p className="text-sm text-inventu-gray">Gerando seu vídeo...</p>
          <p className="text-xs text-inventu-gray/70 mt-1">
            Isso pode levar alguns instantes. Por favor, aguarde.
          </p>
        </div>
      );
    }
    return null;
  };
  
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
          {renderModeIcon()}
          <span className="capitalize">{message.mode || 'text'}</span>
        </div>
        <span>{message.timestamp}</span>
      </div>
      
      {/* Conteúdo da mensagem */}
      <div className={cn(
        "chat-bubble",
        isUser ? "user-bubble" : "ai-bubble",
        "break-words p-3 rounded-xl max-w-[80%]",
        isUser ? "bg-inventu-blue/20 text-white" : "bg-inventu-card text-white",
        isLoading && !isVideo && "animate-pulse"
      )}>
        {isLoading && !isVideo ? (
          <div className="flex items-center">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {displayContent}
          </div>
        ) : (
          displayContent
        )}
        
        {/* Indicador de carregamento de vídeo */}
        {renderVideoLoading()}
        
        {/* Renderizar mídia se estiver presente */}
        {mediaUrl && message.mode === 'image' && (
          <div className="mt-2">
            <img 
              src={mediaUrl} 
              alt="Imagem gerada" 
              className="max-w-full rounded-lg max-h-80 object-contain" 
            />
          </div>
        )}
        
        {mediaUrl && message.mode === 'video' && (
          <div className="mt-2">
            <video 
              src={mediaUrl} 
              controls 
              className="max-w-full rounded-lg max-h-80" 
            />
          </div>
        )}
        
        {message.audioData && message.mode === 'audio' && (
          <div className="mt-2">
            <audio 
              src={message.audioData} 
              controls 
              className="w-full" 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
