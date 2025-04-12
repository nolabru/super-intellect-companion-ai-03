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
  
  const [mediaError, setMediaError] = useState(false);
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [videoLoadingTimedOut, setVideoLoadingTimedOut] = useState(false);

  const hasEmbeddedMedia = message.content?.includes('[Imagem gerada]:') || 
                           message.content?.includes('[Vídeo gerado]:') ||
                           message.content?.includes('[Áudio gerado]');
  
  const extractMediaUrl = (content: string): string | null => {
    if (!content) return null;
    
    if (content.includes('[Imagem gerada]:') || content.includes('[Vídeo gerado]:')) {
      const match = content.match(/\]\: (https?:\/\/[^\s]+)/);
      return match ? match[1] : null;
    }
    return null;
  };

  const cleanContent = (content: string): string => {
    if (!content) return '';
    
    return content
      .replace(/\[Imagem gerada\]\: https?:\/\/[^\s]+/, '')
      .replace(/\[Vídeo gerado\]\: https?:\/\/[^\s]+/, '')
      .replace(/\[Áudio gerado\]/, '')
      .trim();
  };

  const mediaUrl = React.useMemo(() => {
    if (message.mediaUrl) return message.mediaUrl;
    if (message.files && message.files.length > 0) return message.files[0];
    if (hasEmbeddedMedia) return extractMediaUrl(message.content);
    return null;
  }, [message.mediaUrl, message.files, message.content, hasEmbeddedMedia]);
  
  const hasLumaId = message.content && message.content.includes('ID:') && message.model && message.model.includes('luma');
  
  useEffect(() => {
    if (mediaUrl) {
      console.log(`Nova URL de mídia detectada: ${mediaUrl.substring(0, 30)}...`);
      setMediaError(false);
      setIsMediaLoading(true);
    }
  }, [mediaUrl]);
  
  const displayContent = hasEmbeddedMedia ? cleanContent(message.content) : message.content;
  
  const handleMediaLoaded = () => {
    setIsMediaLoading(false);
    console.log(`Mídia (${message.mode}) carregada com sucesso:`, mediaUrl);
  };

  const handleMediaError = (e: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement | HTMLAudioElement>) => {
    console.error(`Erro ao carregar mídia (${message.mode}):`, mediaUrl, e);
    setMediaError(true);
    setIsMediaLoading(false);
    
    if (!isVideo && e.currentTarget) {
      e.currentTarget.style.display = 'none';
    }
    
    toast.error(`Não foi possível carregar ${isImage ? 'a imagem' : isVideo ? 'o vídeo' : 'o áudio'}`);
  };

  const retryMediaLoad = () => {
    setMediaError(false);
    setIsMediaLoading(true);
    toast.info(`Tentando carregar ${isImage ? 'imagem' : isVideo ? 'vídeo' : 'áudio'} novamente...`);
    
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
  
  const openMediaInNewTab = () => {
    if (mediaUrl) {
      window.open(mediaUrl, '_blank');
      toast.success('Abrindo mídia em nova aba');
    }
  };
  
  const handleVideoLoadingTimeout = () => {
    setVideoLoadingTimedOut(true);
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
      <div className={cn(
        "chat-bubble group",
        isUser ? "user-bubble" : "ai-bubble",
        "break-words p-4 rounded-2xl max-w-[85%]",
        isUser ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white" : "bg-gradient-to-br from-gray-800/90 to-gray-900/90 text-white",
        isLoading && !isVideo && "animate-pulse",
        isError && "bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30"
      )}>
        <div className="text-xs opacity-70 mb-1">
          {isUser ? "Você" : message.model}
          {!isUser && message.mode && message.mode !== 'text' && (
            <span className="ml-1 opacity-70">• <ModeIcon mode={message.mode} className="inline" /></span>
          )}
        </div>
        
        <ChatMessageContent 
          content={displayContent}
          isLoading={isLoading && !isVideo}
          isError={isError}
        />
        
        <VideoLoading 
          isLoading={isLoading} 
          isVideo={isVideo} 
          model={message.model || ''}
          onTimeout={handleVideoLoadingTimeout}
        />
        
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
