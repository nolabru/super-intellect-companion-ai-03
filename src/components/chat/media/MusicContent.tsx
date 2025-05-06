
import React, { useState } from 'react';
import { Loader2, Music, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MediaActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  loading?: boolean;
  label: string;
  variant?: "ghost" | "link" | "default" | "destructive" | "outline" | "secondary" | null | undefined;
}

const MediaActionButton: React.FC<MediaActionButtonProps> = ({
  onClick,
  icon,
  loading = false,
  label,
  variant = "outline"
}) => {
  return (
    <Button
      variant={variant}
      size="sm"
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-1 text-xs"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : icon}
      <span>{label}</span>
    </Button>
  );
};

interface MediaLoadingProps {
  text: string;
}

const MediaLoading: React.FC<MediaLoadingProps> = ({ text }) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
      <Loader2 className="h-8 w-8 mb-4 animate-spin" />
      <p>{text}</p>
    </div>
  );
};

interface MediaErrorDisplayProps {
  text: string;
}

const MediaErrorDisplay: React.FC<MediaErrorDisplayProps> = ({ text }) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-destructive">
      <p>{text}</p>
    </div>
  );
};

interface MusicContentProps {
  src: string;
  onLoad?: () => void;
  onError?: (e: React.SyntheticEvent<HTMLAudioElement>) => void;
  isLoading?: boolean;
  onSaveToGallery?: () => void;
  saving?: boolean;
  lyrics?: string;
  title?: string;
}

const MusicContent: React.FC<MusicContentProps> = ({
  src,
  onLoad,
  onError,
  isLoading = false,
  onSaveToGallery,
  saving = false,
  lyrics,
  title
}) => {
  const [error, setError] = useState<boolean>(false);
  const [playing, setPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [showLyrics, setShowLyrics] = useState<boolean>(true);
  
  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    setError(true);
    if (onError) onError(e);
  };
  
  const handlePlayStateChange = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    setPlaying(!e.currentTarget.paused);
  };
  
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    setCurrentTime(e.currentTarget.currentTime);
  };
  
  const handleDurationChange = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    setDuration(e.currentTarget.duration);
    if (onLoad) onLoad();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Determinar se o src é um URL de vídeo ou áudio
  const isVideo = src?.toLowerCase().includes('.mp4') || 
                  src?.toLowerCase().includes('video');
  
  if (isLoading) {
    return <MediaLoading text="Carregando música..." />;
  }
  
  if (error) {
    return <MediaErrorDisplay text="Erro ao carregar a música" />;
  }

  // Configuração para vídeo musical (com letra incorporada)
  if (isVideo) {
    return (
      <div className="relative w-full overflow-hidden rounded-md">
        <div className="aspect-video bg-black rounded-md overflow-hidden">
          <video
            src={src}
            controls
            className="w-full h-full"
            onError={handleAudioError}
            onLoadedMetadata={onLoad}
          />
        </div>
        
        <div className="flex justify-between mt-2">
          <div className="flex gap-1">
            {onSaveToGallery && (
              <MediaActionButton
                onClick={onSaveToGallery}
                icon={<Download size={16} />}
                loading={saving}
                label="Salvar na galeria"
                variant="outline"
              />
            )}
          </div>
          
          <div className="flex items-center text-xs text-muted-foreground">
            <Music className="h-3 w-3 mr-1" />
            <span>{title || "Música gerada por IA"}</span>
          </div>
        </div>
      </div>
    );
  }

  // Configuração para áudio musical (com letra separada)
  return (
    <div className="w-full bg-muted/30 rounded-md overflow-hidden border border-border">
      {title && (
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-medium flex items-center">
            <Music className="h-4 w-4 mr-2" />
            {title}
          </h3>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row">
        {/* Player de áudio */}
        <div className="p-4 flex-shrink-0 md:w-80 w-full">
          <audio
            controls
            src={src}
            onError={handleAudioError}
            onPlay={handlePlayStateChange}
            onPause={handlePlayStateChange}
            onTimeUpdate={handleTimeUpdate}
            onDurationChange={handleDurationChange}
            onLoadedMetadata={handleDurationChange}
            className="w-full"
          />
          
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <div>{formatTime(currentTime)}</div>
            <div>{formatTime(duration)}</div>
          </div>
          
          <div className="flex justify-between mt-4">
            {onSaveToGallery && (
              <MediaActionButton
                onClick={onSaveToGallery}
                icon={<Download size={16} />}
                loading={saving}
                label="Salvar"
                variant="outline"
              />
            )}
            
            {lyrics && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowLyrics(!showLyrics)}
                className="text-xs"
              >
                {showLyrics ? "Ocultar letra" : "Mostrar letra"}
              </Button>
            )}
            
            <MediaActionButton
              onClick={() => window.open(src, '_blank')}
              icon={<ExternalLink size={16} />}
              label="Abrir"
              variant="outline"
            />
          </div>
        </div>
        
        {/* Letra da música */}
        {lyrics && showLyrics && (
          <div className="border-t md:border-t-0 md:border-l border-border flex-grow p-4">
            <h4 className="text-sm font-medium mb-2">Letra</h4>
            <ScrollArea className="h-64">
              <div className="whitespace-pre-wrap text-sm">
                {lyrics}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicContent;
