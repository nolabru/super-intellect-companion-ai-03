
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { isVideoUrlValid, recoverVideo, registerRecoveredVideo } from '@/utils/videoRecoveryUtils';
import { toast } from 'sonner';

interface VideoRecoveryToolProps {
  onRecovered?: (url: string) => void;
  taskId?: string;
  userId?: string;
}

const VideoRecoveryTool: React.FC<VideoRecoveryToolProps> = ({
  onRecovered,
  taskId,
  userId
}) => {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [taskIdInput, setTaskIdInput] = useState<string>(taskId || '');
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveredUrl, setRecoveredUrl] = useState<string | null>(null);
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Função para verificar uma URL de vídeo diretamente
  const handleCheckUrl = async (url: string = videoUrl) => {
    if (!url) {
      toast.error("Por favor, informe uma URL");
      return;
    }
    
    setIsRecovering(true);
    setIsValidUrl(null);
    
    try {
      // Verificar se é uma URL válida
      const isValid = await isVideoUrlValid(url);
      
      setIsValidUrl(isValid);
      
      if (isValid) {
        setRecoveredUrl(url);
        toast.success("URL de vídeo válida!");
        
        if (onRecovered) {
          onRecovered(url);
        }
      } else {
        setRecoveredUrl(null);
        toast.error("URL de vídeo inválida ou inacessível");
      }
    } catch (error) {
      setIsValidUrl(false);
      toast.error("Erro ao verificar URL", {
        description: error instanceof Error ? error.message : "Erro ao acessar URL"
      });
    } finally {
      setIsRecovering(false);
    }
  };
  
  // Função para recuperar usando task ID
  const handleRecoverByTaskId = async () => {
    if (!taskIdInput) {
      toast.error("Por favor, informe um ID de tarefa");
      return;
    }
    
    setIsRecovering(true);
    setIsValidUrl(null);
    
    try {
      // Possíveis URLs baseadas no ID da tarefa
      const possibleUrls = [
        `https://storage.googleapis.com/piapi-videos/${taskIdInput}.mp4`,
        `https://storage.googleapis.com/piapi-results/${taskIdInput}.mp4`,
        `https://assets.midjourney.video/${taskIdInput}.mp4`,
        `https://storage.googleapis.com/tech-ai-videos/${taskIdInput}.mp4`,
        `https://api.apiframe.com/output/${taskIdInput}.mp4`
      ];
      
      let foundValidUrl = false;
      
      // Tentar cada URL
      for (const url of possibleUrls) {
        const isValid = await isVideoUrlValid(url);
        
        if (isValid) {
          // Se encontramos uma URL válida
          setVideoUrl(url);
          setRecoveredUrl(url);
          setIsValidUrl(true);
          foundValidUrl = true;
          
          // Registrar no banco se possível
          const result = await recoverVideo(url, taskIdInput);
          
          if (result.success) {
            toast.success("Vídeo encontrado e registrado com sucesso!");
            
            if (onRecovered) {
              onRecovered(url);
            }
          }
          
          break;
        }
      }
      
      if (!foundValidUrl) {
        setRecoveredUrl(null);
        setIsValidUrl(false);
        toast.error("Nenhum vídeo encontrado para este ID de tarefa");
      }
    } catch (error) {
      setIsValidUrl(false);
      toast.error("Erro ao recuperar vídeo", {
        description: error instanceof Error ? error.message : "Erro desconhecido"
      });
    } finally {
      setIsRecovering(false);
    }
  };
  
  // Função para salvar o vídeo recuperado na galeria
  const handleSaveToGallery = async () => {
    if (!recoveredUrl) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      const success = await registerRecoveredVideo(recoveredUrl, `Vídeo recuperado (${taskIdInput || 'URL manual'})`, userId);
      
      if (success) {
        toast.success("Vídeo salvo na galeria com sucesso!");
      } else {
        toast.error("Erro ao salvar vídeo na galeria");
      }
    } catch (error) {
      toast.error("Erro ao salvar na galeria", {
        description: error instanceof Error ? error.message : "Erro desconhecido"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <RefreshCw className="h-5 w-5 mr-2" />
          Recuperação de Vídeos
        </CardTitle>
        <CardDescription>
          Tente recuperar vídeos gerados usando URL ou ID da tarefa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Campo para verificar URL */}
        <div className="space-y-2">
          <label className="text-sm font-medium">URL do Vídeo</label>
          <div className="flex gap-2">
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://example.com/video.mp4"
              className="flex-1"
            />
            <Button 
              onClick={() => handleCheckUrl()}
              disabled={isRecovering || !videoUrl}
              size="sm"
            >
              {isRecovering ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verificar'}
            </Button>
          </div>
        </div>
        
        {/* Campo para verificar por ID da tarefa */}
        <div className="space-y-2">
          <label className="text-sm font-medium">ID da Tarefa</label>
          <div className="flex gap-2">
            <Input
              value={taskIdInput}
              onChange={(e) => setTaskIdInput(e.target.value)}
              placeholder="task_abc123"
              className="flex-1"
            />
            <Button 
              onClick={handleRecoverByTaskId}
              disabled={isRecovering || !taskIdInput}
              size="sm"
            >
              {isRecovering ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Recuperar'}
            </Button>
          </div>
        </div>
        
        {/* Status da verificação */}
        {isValidUrl !== null && (
          <div className={`p-2 rounded-md flex items-center ${isValidUrl ? 'bg-green-900/20 text-green-500' : 'bg-red-900/20 text-red-500'}`}>
            {isValidUrl ? (
              <>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                <span>URL válida</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 mr-2" />
                <span>URL inválida ou inacessível</span>
              </>
            )}
          </div>
        )}
        
        {/* Prévia do vídeo recuperado */}
        {recoveredUrl && (
          <div className="mt-4">
            <label className="text-sm font-medium">Prévia do Vídeo</label>
            <div className="aspect-video mt-2 bg-black/20 rounded-md overflow-hidden">
              <video 
                src={recoveredUrl} 
                controls 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}
      </CardContent>
      {recoveredUrl && (
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(recoveredUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir em Nova Aba
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSaveToGallery}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar na Galeria
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default VideoRecoveryTool;
