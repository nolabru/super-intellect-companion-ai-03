
import React, { useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink, Loader2, RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ChatMode } from '../ModeSelector';
import { useMediaGallery } from '@/hooks/useMediaGallery';

interface MediaContainerProps {
  mediaUrl: string | null;
  mode: ChatMode;
  onMediaLoaded: () => void;
  onMediaError: (e: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement | HTMLAudioElement>) => void;
  mediaError: boolean;
  isMediaLoading: boolean;
  retryMediaLoad: () => void;
  openMediaInNewTab: () => void;
  audioData?: string;
  prompt?: string;
  modelId?: string;
}

const MediaContainer: React.FC<MediaContainerProps> = ({
  mediaUrl,
  mode,
  onMediaLoaded,
  onMediaError,
  mediaError,
  isMediaLoading,
  retryMediaLoad,
  openMediaInNewTab,
  audioData,
  prompt = '',
  modelId
}) => {
  const isImage = mode === 'image';
  const isVideo = mode === 'video';
  const isAudio = mode === 'audio';
  const { saveMediaToGallery, saving } = useMediaGallery();
  const [retryCount, setRetryCount] = useState(0);
  
  useEffect(() => {
    if (mediaError && isVideo && mediaUrl && retryCount < 3) {
      const retryTimer = setTimeout(() => {
        console.log(`Tentativa automática ${retryCount + 1} de carregar o vídeo`);
        retryMediaLoad();
        setRetryCount(prev => prev + 1);
      }, 3000);
      
      return () => clearTimeout(retryTimer);
    }
  }, [mediaError, isVideo, mediaUrl, retryCount, retryMediaLoad]);

  const handleSaveToGallery = async () => {
    if (!mediaUrl && !audioData) {
      toast.error('Não há mídia para salvar na galeria');
      return;
    }

    try {
      await saveMediaToGallery(
        mediaUrl || audioData || '',
        prompt,
        mode,
        modelId
      );

      toast.success('Mídia salva na galeria com sucesso');
    } catch (error) {
      console.error('Erro ao salvar na galeria:', error);
      toast.error('Não foi possível salvar a mídia na galeria');
    }
  };
  
  if (mediaError) {
    return (
      <div className="mt-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
        <p className="text-sm text-red-400 flex items-start">
          <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
          <span>
            Não foi possível carregar a mídia. 
            {isVideo && "Isso pode ocorrer porque o vídeo ainda está sendo processado ou devido a limitações temporárias."}
            {!isVideo && "Isto pode ocorrer devido a erros na API ou problemas temporários de conexão."}
          </span>
        </p>
        <div className="mt-2 flex space-x-2">
          <button 
            onClick={retryMediaLoad}
            className="text-xs bg-red-900/40 hover:bg-red-900/60 text-white py-1 px-2 rounded flex items-center"
          >
            <RefreshCw size={12} className="mr-1" />
            Tentar novamente
          </button>
          {mediaUrl && (
            <button 
              onClick={openMediaInNewTab}
              className="text-xs bg-inventu-darker/50 hover:bg-inventu-darker/80 text-white py-1 px-2 rounded flex items-center"
            >
              <ExternalLink size={12} className="mr-1" />
              Abrir link diretamente
            </button>
          )}
        </div>
      </div>
    );
  }
  
  if (isImage && mediaUrl) {
    return (
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
          onLoad={onMediaLoaded}
          onError={onMediaError}
        />
        {!isMediaLoading && (
          <div className="mt-1 flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs flex items-center text-inventu-gray hover:text-white"
              onClick={handleSaveToGallery}
              disabled={saving}
            >
              {saving ? (
                <Loader2 size={12} className="mr-1 animate-spin" />
              ) : (
                <Save size={12} className="mr-1" />
              )}
              Salvar na galeria
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs flex items-center text-inventu-gray hover:text-white"
              onClick={openMediaInNewTab}
            >
              <ExternalLink size={12} className="mr-1" />
              Abrir em nova aba
            </Button>
          </div>
        )}
      </div>
    );
  }
  
  if (isVideo && mediaUrl) {
    return (
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
          onLoadedData={onMediaLoaded}
          onError={onMediaError}
          autoPlay={false}
          preload="metadata"
          playsInline
          controlsList="nodownload"
        />
        {!isMediaLoading && (
          <div className="mt-1 flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs flex items-center text-inventu-gray hover:text-white"
              onClick={handleSaveToGallery}
              disabled={saving}
            >
              {saving ? (
                <Loader2 size={12} className="mr-1 animate-spin" />
              ) : (
                <Save size={12} className="mr-1" />
              )}
              Salvar na galeria
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs flex items-center text-inventu-gray hover:text-white"
              onClick={openMediaInNewTab}
            >
              <ExternalLink size={12} className="mr-1" />
              Abrir em nova aba
            </Button>
          </div>
        )}
      </div>
    );
  }
  
  if (isAudio && (audioData || mediaUrl)) {
    return (
      <div className="mt-2 relative">
        {isMediaLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-inventu-darker/50 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-inventu-gray" />
          </div>
        )}
        <audio 
          src={audioData || mediaUrl || ''} 
          controls 
          className="w-full"
          onLoadedData={onMediaLoaded}
          onError={onMediaError}
          autoPlay={false}
          preload="metadata"
        />
        {!isMediaLoading && (
          <div className="mt-1 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs flex items-center text-inventu-gray hover:text-white"
              onClick={handleSaveToGallery}
              disabled={saving}
            >
              {saving ? (
                <Loader2 size={12} className="mr-1 animate-spin" />
              ) : (
                <Save size={12} className="mr-1" />
              )}
              Salvar na galeria
            </Button>
          </div>
        )}
      </div>
    );
  }
  
  return null;
};

export default MediaContainer;
