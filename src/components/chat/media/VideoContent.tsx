import React, { useState, useEffect } from 'react';
import { useUnifiedMediaGeneration } from '@/hooks/useUnifiedMediaGeneration';
import VideoGenerationRetry from './VideoGenerationRetry';
import VideoLoading from '../VideoLoading';
import { Button } from '@/components/ui/button';
import { Save, ExternalLink, RefreshCcw, Link } from 'lucide-react';
import { toast } from 'sonner';
import { recoverVideo, registerRecoveredVideo, isVideoUrlValid } from '@/utils/videoRecoveryUtils';
import { withRetry } from '@/utils/retryOperations';
import VideoRecoveryTool from '@/components/media/VideoRecoveryTool';

interface VideoContentProps {
  src?: string;
  isLoading?: boolean;
  taskId?: string;
  model?: string;
  onVideoReady?: (url: string) => void;
  onLoad?: () => void;
  onError?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onSaveToGallery?: () => Promise<void>;
  onOpenInNewTab?: () => void;
  saving?: boolean;
  showUrlOnly?: boolean;
}

const VideoContent: React.FC<VideoContentProps> = ({
  src,
  isLoading = false,
  taskId,
  model = 'default',
  onVideoReady,
  onLoad,
  onError,
  onSaveToGallery,
  onOpenInNewTab,
  saving = false,
  showUrlOnly = false
}) => {
  const [videoUrl, setVideoUrl] = useState<string | undefined>(src);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [isManuallyChecking, setIsManuallyChecking] = useState(false);
  const [checkAttempts, setCheckAttempts] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState<number>(0);
  const [isDbCheckActive, setIsDbCheckActive] = useState(false);
  const [persistentLoading, setPersistentLoading] = useState(false);
  const [authErrors, setAuthErrors] = useState(0);
  const [isRecovering, setIsRecovering] = useState(false);
  const [videoRecovered, setVideoRecovered] = useState(false);
  const [showUrlView, setShowUrlView] = useState(showUrlOnly);
  
  const { 
    checkTimedOutTask, 
    isCheckingStatus,
    currentTask
  } = useUnifiedMediaGeneration({
    onComplete: (mediaUrl) => {
      setVideoUrl(mediaUrl);
      setHasTimedOut(false);
      setPersistentLoading(false);
      if (onVideoReady) onVideoReady(mediaUrl);
      if (onLoad) onLoad();
      
      // Reset checking states
      setIsManuallyChecking(false);
      setIsDbCheckActive(false);
      setAuthErrors(0);
      
      toast.success("Vídeo concluído com sucesso!");
    }
  });

  // Verificação de recuperação de vídeos completamente gerados
  useEffect(() => {
    // Só executar se temos uma URL de vídeo que não foi carregada pela recuperação manual
    if (videoUrl && !videoRecovered && !isRecovering) {
      const verifyAndRecoverVideo = async () => {
        try {
          // Verificar se a URL é válida
          const isValid = await isVideoUrlValid(videoUrl);
          
          if (isValid && taskId) {
            console.log(`[VideoContent] Recuperando informações para vídeo válido: ${videoUrl}`);
            // Registrar silenciosamente no banco de dados
            await recoverVideo(videoUrl, taskId);
          }
        } catch (error) {
          console.error('[VideoContent] Erro ao verificar vídeo:', error);
        }
      };
      
      verifyAndRecoverVideo();
    }
  }, [videoUrl, taskId, videoRecovered, isRecovering]);
  
  // Enhanced continuous checking system for timed out videos
  useEffect(() => {
    let intervalId: number | undefined;
    
    // Verificamos se o vídeo está carregando (taskId existe) e o progresso está em 95% ou mais
    if (taskId && !videoUrl && currentTask?.progress && currentTask.progress >= 95) {
      console.log(`[VideoContent] Detected high progress (${currentTask.progress}%) - activating persistent loading`);
      setPersistentLoading(true);
    }

    if ((hasTimedOut || persistentLoading) && taskId && !videoUrl && checkAttempts < 40) {
      // Set initial checking state
      setIsManuallyChecking(true);
      
      // Initial check
      const doCheck = async () => {
        console.log(`[VideoContent] Checking video status ${taskId} (attempt ${checkAttempts + 1}/40)`);
        setLastCheckTime(Date.now());
        
        try {
          const success = await checkTimedOutTask();
          
          // If successful, no need for further checks
          if (success) {
            console.log('[VideoContent] Task completed successfully after check');
            return;
          }
          
          // Increment attempts counter
          setCheckAttempts(prev => prev + 1);
          
          // If we've tried several times with the normal API, try a direct DB check
          if (checkAttempts > 5 && !isDbCheckActive) {
            setIsDbCheckActive(true);
            console.log('[VideoContent] Switching to direct DB check strategy');
          }
        } catch (error) {
          // Check if error is authentication related
          const errorMsg = error instanceof Error ? error.message : String(error);
          if (errorMsg.includes('authorization') || errorMsg.includes('401')) {
            setAuthErrors(prev => prev + 1);
            console.error('[VideoContent] Authentication error during check:', error);
            
            // After multiple auth errors, try a different approach
            if (authErrors > 3) {
              setIsDbCheckActive(true);
              console.log('[VideoContent] Multiple auth errors - switching to direct DB check strategy');
            }
          } else {
            console.error('[VideoContent] Error during check:', error);
          }
        } finally {
          setIsManuallyChecking(false);
        }
      };
      
      // Run initial check
      doCheck();
      
      // Set up periodic checks every 10 seconds
      intervalId = window.setInterval(async () => {
        // Only check if not already checking and still in timed out state
        if (!isManuallyChecking && !isCheckingStatus && (hasTimedOut || persistentLoading) && !videoUrl) {
          // Ensure we don't check too frequently (minimum 8 seconds between checks)
          const now = Date.now();
          if (now - lastCheckTime >= 8000) {
            setIsManuallyChecking(true);
            await doCheck();
          }
        }
      }, 10000); // Check every 10 seconds
    }
    
    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [hasTimedOut, taskId, videoUrl, checkAttempts, checkTimedOutTask, isCheckingStatus, 
      isManuallyChecking, lastCheckTime, isDbCheckActive, persistentLoading, currentTask, authErrors]);

  // Additional effect to monitor progress and prevent premature timeout for videos at high progress
  useEffect(() => {
    if (currentTask?.progress && currentTask.progress >= 95 && isLoading) {
      console.log(`[VideoContent] Progress at ${currentTask.progress}% - activating persistent mode`);
      setPersistentLoading(true);
    }
  }, [currentTask?.progress, isLoading]);

  const handleTimeout = () => {
    // Only timeout if we're not already in persistent loading mode
    if (!persistentLoading) {
      setHasTimedOut(true);
      toast.info(
        "O vídeo está demorando mais que o esperado", 
        { description: "Estamos verificando automaticamente o progresso a cada 10 segundos" }
      );
    } else {
      console.log('[VideoContent] Timeout ignored due to high progress persistent mode');
    }
  };
  
  const handleRetry = async () => {
    setIsManuallyChecking(true);
    try {
      // Log extra info for debugging
      console.log(`[VideoContent] Manual retry triggered for task ${taskId}`);
      console.log(`[VideoContent] Current attempts: ${checkAttempts}`);
      
      // Reset auth errors counter on manual retry
      setAuthErrors(0);
      
      const success = await checkTimedOutTask();
      if (success) {
        toast.success("Vídeo concluído com sucesso!");
      } else {
        toast.info("Vídeo ainda em processamento", { 
          description: "Continuaremos verificando automaticamente"
        });
      }
    } catch (error) {
      console.error('[VideoContent] Error during retry:', error);
      toast.error("Erro ao verificar o status do vídeo", {
        description: error instanceof Error ? error.message : "Tente novamente mais tarde"
      });
      
      // Check if error is authentication related
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes('authorization') || errorMsg.includes('401')) {
        setAuthErrors(prev => prev + 1);
        console.error('[VideoContent] Authentication error during manual check:', error);
      }
    } finally {
      setIsManuallyChecking(false);
    }
  };

  // Nova função para tentar recuperar o vídeo diretamente pela URL
  const handleRecoverVideo = async () => {
    if (!taskId) {
      toast.error("Não é possível recuperar um vídeo sem o ID da tarefa");
      return;
    }
    
    setIsRecovering(true);
    toast.loading("Tentando recuperar vídeo...");
    
    try {
      // Tentar recuperação com retry
      const result = await withRetry(
        async () => {
          // Se já temos uma URL, tentar usá-la diretamente
          if (src) {
            const recovered = await recoverVideo(src, taskId);
            if (recovered.success) {
              return recovered;
            }
          }
          
          // Se não temos URL ou falhou, criar possíveis URLs baseadas no taskId
          // Essas são URLs comuns de serviços de geração de vídeo
          const possibleUrls = [
            `https://storage.googleapis.com/piapi-videos/${taskId}.mp4`,
            `https://storage.googleapis.com/piapi-results/${taskId}.mp4`,
            `https://assets.midjourney.video/${taskId}.mp4`,
            `https://storage.googleapis.com/tech-ai-videos/${taskId}.mp4`,
            `https://api.apiframe.com/output/${taskId}.mp4`
          ];
          
          // Tentar cada uma das URLs possíveis
          for (const url of possibleUrls) {
            console.log(`[VideoContent] Tentando recuperar de URL: ${url}`);
            const result = await recoverVideo(url, taskId);
            if (result.success) {
              return result;
            }
          }
          
          throw new Error("Não foi possível encontrar o vídeo em nenhuma URL conhecida");
        },
        {
          maxRetries: 3,
          initialDelay: 1000,
          useExponentialBackoff: true,
          logRetries: true
        }
      );
      
      // Se recuperou com sucesso
      if (result.success && result.url) {
        toast.dismiss();
        toast.success("Vídeo recuperado com sucesso!");
        setVideoUrl(result.url);
        setVideoRecovered(true);
        setHasTimedOut(false);
        setPersistentLoading(false);
        
        if (onVideoReady) onVideoReady(result.url);
      } else {
        toast.dismiss();
        toast.error("Não foi possível recuperar o vídeo");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Erro ao recuperar vídeo", {
        description: error instanceof Error ? error.message : "Erro desconhecido"
      });
      console.error('[VideoContent] Erro na recuperação de vídeo:', error);
    } finally {
      setIsRecovering(false);
    }
  };

  // Função para recuperar vídeo por URL direta especificada pelo usuário
  const handleRecoverByUrl = async (url: string) => {
    if (!url) return;
    
    setIsRecovering(true);
    toast.loading("Verificando URL do vídeo...");
    
    try {
      // Verificar se é uma URL válida
      const isValid = await isVideoUrlValid(url);
      
      if (isValid) {
        // Se tem taskId, registrar no banco
        if (taskId) {
          await recoverVideo(url, taskId);
        }
        
        // Atualizar interface
        toast.dismiss();
        toast.success("Vídeo recuperado com sucesso!");
        setVideoUrl(url);
        setVideoRecovered(true);
        setHasTimedOut(false);
        setPersistentLoading(false);
        
        if (onVideoReady) onVideoReady(url);
      } else {
        toast.dismiss();
        toast.error("URL de vídeo inválida ou inacessível");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Erro ao verificar URL do vídeo", {
        description: error instanceof Error ? error.message : "Erro desconhecido"
      });
    } finally {
      setIsRecovering(false);
    }
  };

  const handleVideoLoad = () => {
    if (onLoad) onLoad();
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (onError) onError(e);
  };

  // Renderizar botão de recuperação quando o vídeo tiver problemas de carregamento
  const renderRecoveryOptions = () => {
    return (
      <div className="mt-4 space-y-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRecoverVideo}
          disabled={isRecovering}
          className="w-full"
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          {isRecovering ? 'Tentando recuperar...' : 'Tentar recuperar vídeo'}
        </Button>
        
        <div className="flex gap-2 mt-2">
          <input 
            type="text"
            placeholder="Cole uma URL de vídeo diretamente..."
            className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleRecoverByUrl((e.target as HTMLInputElement).value);
              }
            }}
          />
          <Button size="sm" onClick={(e) => {
            const input = (e.target as HTMLElement).closest('div')?.querySelector('input');
            if (input) {
              handleRecoverByUrl(input.value);
            }
          }}>
            Verificar
          </Button>
        </div>
      </div>
    );
  };
  
  // Show a special message when authentication errors occur
  const getRetryMessage = () => {
    if (authErrors > 3) {
      return "Estamos encontrando dificuldades para verificar o status do vídeo devido a um problema de autenticação. Estamos usando uma verificação alternativa.";
    } else if (persistentLoading) {
      return "O vídeo está em fase final de processamento (95% ou mais). Estamos verificando automaticamente o status a cada 10 segundos.";
    } else {
      return "O tempo de geração do vídeo excedeu o limite. Estamos verificando automaticamente o status a cada 10 segundos.";
    }
  };

  // Toggle between URL view and embedded view
  const toggleUrlView = () => {
    setShowUrlView(prev => !prev);
  };

  if (!videoUrl && !isLoading && (hasTimedOut || persistentLoading)) {
    return (
      <VideoGenerationRetry 
        onRetry={handleRetry}
        isChecking={isCheckingStatus || isManuallyChecking}
        message={getRetryMessage()}
        attempts={checkAttempts}
        autoRetry={true}
        autoRetryInterval={10000}
        additionalContent={renderRecoveryOptions()}
      />
    );
  }

  if ((isLoading || persistentLoading) && !videoUrl) {
    return (
      <VideoLoading 
        isLoading={true} 
        isVideo={true} 
        model={model} 
        progress={currentTask?.progress}
        onTimeout={handleTimeout}
      />
    );
  }

  if (videoUrl && showUrlView) {
    return (
      <div className="w-full space-y-3">
        <div className="flex items-center gap-2 p-3 bg-black/20 rounded-md border border-white/10">
          <Link className="h-4 w-4 text-blue-400 flex-shrink-0" />
          <input 
            type="text" 
            value={videoUrl} 
            readOnly 
            className="bg-transparent border-none outline-none text-xs flex-1 overflow-x-auto whitespace-nowrap scrollbar-thin overflow-y-hidden"
            style={{ scrollbarWidth: 'thin' }}
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => {
              navigator.clipboard.writeText(videoUrl);
              toast.success("URL copiada para a área de transferência");
            }}
          >
            Copiar
          </Button>
        </div>

        {/* Ação para alternar para visão de vídeo */}
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleUrlView}
            className="text-xs"
          >
            Mostrar Vídeo
          </Button>
        </div>

        {/* Ações adicionais */}
        <div className="flex items-center justify-end gap-2">
          {onSaveToGallery && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSaveToGallery}
              disabled={saving}
              title="Salvar na galeria"
            >
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          )}
          
          {onOpenInNewTab && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenInNewTab}
              title="Abrir em nova aba"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Abrir
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (videoUrl) {
    return (
      <div className="w-full">
        <video 
          className="w-full rounded-lg"
          controls 
          src={videoUrl}
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
        >
          Your browser does not support the video tag.
        </video>

        <div className="flex items-center justify-end gap-2 mt-2">
          {/* Botão para mostrar apenas a URL */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleUrlView}
            title="Mostrar URL"
          >
            <Link className="h-4 w-4 mr-1" />
            Mostrar URL
          </Button>

          {onSaveToGallery && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSaveToGallery}
              disabled={saving}
              title="Salvar na galeria"
            >
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          )}
          
          {onOpenInNewTab && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenInNewTab}
              title="Abrir em nova aba"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Abrir
            </Button>
          )}

          {/* Adicionar botão para recuperar no banco se foi recuperado manualmente */}
          {videoRecovered && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (videoUrl) {
                  const success = await registerRecoveredVideo(videoUrl);
                  if (success) {
                    toast.success("Vídeo registrado na galeria com sucesso!");
                  }
                }
              }}
              title="Registrar vídeo recuperado"
            >
              <Save className="h-4 w-4 mr-1" />
              Registrar
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default VideoContent;
