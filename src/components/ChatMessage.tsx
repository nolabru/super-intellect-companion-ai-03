
import React from 'react';
import { ChatMode } from './ModeSelector';
import { Text, Image, Video, AudioLines, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
}

interface ChatMessageProps {
  message: MessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const isLoading = message.loading || message.id?.startsWith('loading-');
  const isVideo = message.mode === 'video';
  const isImage = message.mode === 'image';
  const isAudio = message.mode === 'audio';
  const isError = message.error;
  
  // Estado para rastrear erros de carregamento de mídia
  const [mediaError, setMediaError] = React.useState(false);
  const [isMediaLoading, setIsMediaLoading] = React.useState(true);
  
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
  const mediaUrl = message.mediaUrl || 
                  (message.files && message.files.length > 0 ? message.files[0] : null) || 
                  (hasEmbeddedMedia ? extractMediaUrl(message.content) : null);
  
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

  // Função para lidar com carregamento de mídia bem-sucedido
  const handleMediaLoaded = () => {
    setIsMediaLoading(false);
    console.log(`Mídia (${message.mode}) carregada com sucesso:`, mediaUrl);
  };

  // Função para lidar com erros de mídia
  const handleMediaError = (e: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement | HTMLAudioElement>) => {
    console.error(`Erro ao carregar mídia (${message.mode}):`, mediaUrl);
    setMediaError(true);
    setIsMediaLoading(false);
    e.currentTarget.style.display = 'none';
    toast.error(`Não foi possível carregar a ${message.mode === 'image' ? 'imagem' : message.mode === 'video' ? 'vídeo' : 'mídia'}`);
  };

  // Função para tentar novamente o carregamento de mídia
  const retryMediaLoad = () => {
    setMediaError(false);
    setIsMediaLoading(true);
    toast.info(`Tentando carregar ${message.mode === 'image' ? 'imagem' : message.mode === 'video' ? 'vídeo' : 'mídia'} novamente...`);
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
        isLoading && !isVideo && "animate-pulse",
        isError && "bg-red-900/20 border border-red-500/30"
      )}>
        {isLoading && !isVideo ? (
          <div className="flex items-center">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {displayContent}
          </div>
        ) : isError ? (
          <div className="flex flex-col">
            <div className="text-red-400 font-medium mb-1 flex items-center">
              <AlertTriangle size={16} className="mr-1" /> Erro
            </div>
            <div>{displayContent}</div>
            <div className="mt-2 text-sm text-red-400/80">
              Por favor, tente novamente ou escolha um parâmetro diferente.
            </div>
          </div>
        ) : (
          displayContent
        )}
        
        {/* Indicador de carregamento de vídeo */}
        {renderVideoLoading()}
        
        {/* Renderizar mídia se estiver presente */}
        {mediaUrl && isImage && !isLoading && !mediaError && (
          <div className="mt-2 relative">
            {isMediaLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-inventu-darker/50 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-inventu-gray" />
              </div>
            )}
            <img 
              src={mediaUrl} 
              alt="Imagem gerada" 
              className="max-w-full rounded-lg max-h-80 object-contain" 
              onLoad={handleMediaLoaded}
              onError={handleMediaError}
            />
          </div>
        )}
        
        {mediaUrl && isVideo && !isLoading && !mediaError && (
          <div className="mt-2 relative">
            {isMediaLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-inventu-darker/50 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-inventu-gray" />
              </div>
            )}
            <video 
              src={mediaUrl} 
              controls 
              className="max-w-full rounded-lg max-h-80"
              onLoadedData={handleMediaLoaded}
              onError={handleMediaError}
            />
          </div>
        )}
        
        {message.audioData && isAudio && !isLoading && !mediaError && (
          <div className="mt-2 relative">
            {isMediaLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-inventu-darker/50 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-inventu-gray" />
              </div>
            )}
            <audio 
              src={message.audioData} 
              controls 
              className="w-full"
              onLoadedData={handleMediaLoaded}
              onError={handleMediaError}
            />
          </div>
        )}
        
        {/* Mostrar botão para tentar novamente se houver erro de mídia */}
        {mediaError && (
          <div className="mt-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400 flex items-start">
              <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>Não foi possível carregar a mídia. Isto pode ocorrer devido a erros na API do Luma ou problemas temporários de conexão.</span>
            </p>
            <button 
              onClick={retryMediaLoad}
              className="mt-2 text-xs bg-red-900/40 hover:bg-red-900/60 text-white py-1 px-2 rounded flex items-center"
            >
              <RefreshCw size={12} className="mr-1" />
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
