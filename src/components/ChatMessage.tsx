
import React from 'react';
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
  const [mediaError, setMediaError] = React.useState(false);
  const [isMediaLoading, setIsMediaLoading] = React.useState(true);

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
  const mediaUrl = React.useMemo(() => {
    if (message.mediaUrl) return message.mediaUrl;
    if (message.files && message.files.length > 0) return message.files[0];
    if (hasEmbeddedMedia) return extractMediaUrl(message.content);
    return null;
  }, [message.mediaUrl, message.files, message.content, hasEmbeddedMedia]);
  
  // Conteúdo limpo para exibição
  const displayContent = hasEmbeddedMedia ? cleanContent(message.content) : message.content;
  
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
  
  // Abrir mídia em nova aba
  const openMediaInNewTab = () => {
    if (mediaUrl) {
      window.open(mediaUrl, '_blank');
      toast.success('Abrindo mídia em nova aba');
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
        />
        
        {/* Renderizar mídia se estiver presente */}
        <MediaContainer 
          mediaUrl={mediaUrl}
          mode={message.mode || 'text'}
          onMediaLoaded={handleMediaLoaded}
          onMediaError={handleMediaError}
          mediaError={mediaError}
          isMediaLoading={isMediaLoading}
          retryMediaLoad={retryMediaLoad}
          openMediaInNewTab={openMediaInNewTab}
          audioData={message.audioData}
        />
      </div>
    </div>
  );
};

export default ChatMessage;
