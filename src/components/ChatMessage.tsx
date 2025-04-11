
import React, { useState, useEffect } from 'react';
import { ChatMode } from './ModeSelector';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ModeIcon from './chat/ModeIcon';
import ChatMessageContent from './chat/ChatMessageContent';
import MediaContainer from './chat/MediaContainer';
import VideoLoading from './chat/VideoLoading';

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
  const [mediaError, setMediaError] = useState(false);
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [videoLoadingTimedOut, setVideoLoadingTimedOut] = useState(false);

  // Verificar se a mensagem contém uma URL de mídia embutida
  const hasEmbeddedMedia = message.content?.includes('[Imagem gerada]:') || 
                           message.content?.includes('[Vídeo gerado]:') ||
                           message.content?.includes('[Áudio gerado]');
  
  // Extrair URL da mídia se estiver embutida no conteúdo
  const extractMediaUrl = (content: string): string | null => {
    if (!content) return null;
    
    if (content.includes('[Imagem gerada]:') || content.includes('[Vídeo gerado]:')) {
      const match = content.match(/\]\: (https?:\/\/[^\s]+)/);
      return match ? match[1] : null;
    }
    return null;
  };

  // Limpar o conteúdo da mensagem de marcações de mídia
  const cleanContent = (content: string): string => {
    if (!content) return '';
    
    return content
      .replace(/\[Imagem gerada\]\: https?:\/\/[^\s]+/, '')
      .replace(/\[Vídeo gerado\]\: https?:\/\/[^\s]+/, '')
      .replace(/\[Áudio gerado\]/, '')
      .trim();
  };

  // Determinar URL da mídia (da propriedade ou embutida no conteúdo)
  const mediaUrl = React.useMemo(() => {
    if (message.mediaUrl) return message.mediaUrl;
    if (message.files && message.files.length > 0) return message.files[0];
    if (hasEmbeddedMedia) return extractMediaUrl(message.content);
    return null;
  }, [message.mediaUrl, message.files, message.content, hasEmbeddedMedia]);
  
  // Verificar se existe ID de geração da Luma na mensagem
  const hasLumaId = message.content && message.content.includes('ID:') && message.model && message.model.includes('luma');
  
  // Efeito para redefinir o erro de carregamento de mídia quando a URL mudar
  useEffect(() => {
    if (mediaUrl) {
      console.log(`Nova URL de mídia detectada: ${mediaUrl.substring(0, 30)}...`);
      setMediaError(false);
      setIsMediaLoading(true);
    }
  }, [mediaUrl]);
  
  // Conteúdo limpo para exibição
  const displayContent = hasEmbeddedMedia ? cleanContent(message.content) : message.content;
  
  // Função para lidar com carregamento de mídia bem-sucedido
  const handleMediaLoaded = () => {
    setIsMediaLoading(false);
    console.log(`Mídia (${message.mode}) carregada com sucesso:`, mediaUrl);
  };

  // Função para lidar com erros de mídia
  const handleMediaError = (e: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement | HTMLAudioElement>) => {
    console.error(`Erro ao carregar mídia (${message.mode}):`, mediaUrl, e);
    setMediaError(true);
    setIsMediaLoading(false);
    
    // Não esconder o elemento se for vídeo, para permitir nova tentativa
    // Fix: Check if current target exists before accessing style
    if (!isVideo && e.currentTarget) {
      e.currentTarget.style.display = 'none';
    }
    
    toast.error(`Não foi possível carregar ${isImage ? 'a imagem' : isVideo ? 'o vídeo' : 'o áudio'}`);
  };

  // Função para tentar novamente o carregamento de mídia
  const retryMediaLoad = () => {
    setMediaError(false);
    setIsMediaLoading(true);
    toast.info(`Tentando carregar ${isImage ? 'imagem' : isVideo ? 'vídeo' : 'áudio'} novamente...`);
    
    // Forçar uma atualização do elemento com uma nova URL (adicionando um timestamp)
    if (mediaUrl) {
      const urlWithTimestamp = mediaUrl.includes('?') 
        ? mediaUrl + '&t=' + Date.now() 
        : mediaUrl + '?t=' + Date.now();
      
      const mediaElement = document.querySelector(`[src^="${mediaUrl}"]`) as HTMLImageElement | HTMLVideoElement | HTMLAudioElement;
      if (mediaElement) {
        mediaElement.src = urlWithTimestamp;
        console.log("Elemento de mídia encontrado, atualizando src com timestamp");
      } else {
        console.log("Elemento de mídia não encontrado para atualização");
      }
    }
  };
  
  // Abrir mídia em nova aba
  const openMediaInNewTab = () => {
    if (mediaUrl) {
      window.open(mediaUrl, '_blank');
      toast.success('Abrindo mídia em nova aba');
    }
  };
  
  // Lidar com timeout do carregamento de vídeo
  const handleVideoLoadingTimeout = () => {
    setVideoLoadingTimedOut(true);
    // Se há URL de mídia, tentar carregar, caso contrário apenas mostrar mensagem
    if (mediaUrl) {
      setIsMediaLoading(false);
    } else {
      toast.error('Tempo limite excedido para carregamento do vídeo');
    }
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
          <ModeIcon mode={message.mode} />
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
        <ChatMessageContent 
          content={displayContent}
          isLoading={isLoading && !isVideo}
          isError={isError}
        />
        
        {/* Indicador de carregamento de vídeo */}
        <VideoLoading 
          isLoading={isLoading} 
          isVideo={isVideo} 
          model={message.model || ''}
          onTimeout={handleVideoLoadingTimeout}
        />
        
        {/* Renderizar mídia se estiver presente e visível */}
        {mediaUrl && !isLoading && (message.mode === 'image' || message.mode === 'video' || message.mode === 'audio') && (
          <MediaContainer 
            mediaUrl={mediaUrl}
            mode={message.mode}
            onMediaLoaded={handleMediaLoaded}
            onMediaError={handleMediaError}
            mediaError={mediaError}
            isMediaLoading={isMediaLoading}
            retryMediaLoad={retryMediaLoad}
            openMediaInNewTab={openMediaInNewTab}
            audioData={message.audioData}
            prompt={message.content}
            modelId={message.model}
          />
        )}
        
        {/* Mensagem de debug para quando a mídia não é mostrada */}
        {process.env.NODE_ENV === 'development' && !isUser && (message.mode === 'image' || message.mode === 'video' || message.mode === 'audio') && !mediaUrl && !isLoading && (
          <div className="mt-2 p-2 bg-orange-900/20 border border-orange-500/30 rounded-lg text-xs">
            <p className="text-orange-400">Debug: Modo de mídia ({message.mode}) detectado mas nenhuma URL de mídia encontrada.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
