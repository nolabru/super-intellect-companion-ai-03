
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, RefreshCw, CheckCircle2, XCircle, ExternalLink, Copy, List } from 'lucide-react';
import { isVideoUrlValid, recoverVideo, registerRecoveredVideo, getPossibleVideoUrls } from '@/utils/videoRecoveryUtils';
import { toast } from 'sonner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface VideoRecoveryToolProps {
  onRecovered?: (url: string) => void;
  taskId?: string;
  userId?: string;
  returnUrlOnly?: boolean;
}

const VideoRecoveryTool: React.FC<VideoRecoveryToolProps> = ({
  onRecovered,
  taskId,
  userId,
  returnUrlOnly = false
}) => {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [taskIdInput, setTaskIdInput] = useState<string>(taskId || '');
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveredUrl, setRecoveredUrl] = useState<string | null>(null);
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showUrlCopiedMessage, setShowUrlCopiedMessage] = useState(false);
  const [possibleUrls, setPossibleUrls] = useState<string[]>([]);
  const [checkedUrlsCount, setCheckedUrlsCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>("url");
  
  // Effect to show possible URLs when task ID is entered
  useEffect(() => {
    if (taskIdInput && taskIdInput.length > 5) {
      setPossibleUrls(getPossibleVideoUrls(taskIdInput));
    } else {
      setPossibleUrls([]);
    }
  }, [taskIdInput]);
  
  // Start with default tab
  useEffect(() => {
    if (returnUrlOnly) {
      setActiveTab("url");
    } else if (taskId) {
      setActiveTab("taskid");
    }
  }, [returnUrlOnly, taskId]);
  
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
    setCheckedUrlsCount(0);
    
    try {
      // Get possible URLs based on taskId
      const urlsToCheck = getPossibleVideoUrls(taskIdInput);
      setPossibleUrls(urlsToCheck);
      
      // Try the recovery function which tries multiple strategies
      const result = await recoverVideo(videoUrl, taskIdInput);
      
      if (result.success && result.url) {
        setVideoUrl(result.url);
        setRecoveredUrl(result.url);
        setIsValidUrl(true);
        
        toast.success("Vídeo recuperado com sucesso!");
        
        if (onRecovered) {
          onRecovered(result.url);
        }
      } else {
        // If automatic recovery failed, try each URL manually and track progress
        let foundValidUrl = false;
        let validUrl = '';
        let checkedCount = 0;
        
        toast.info("Tentando várias possíveis URLs...");
        
        for (const url of urlsToCheck) {
          checkedCount++;
          setCheckedUrlsCount(checkedCount);
          
          const isValid = await isVideoUrlValid(url);
          
          if (isValid) {
            foundValidUrl = true;
            validUrl = url;
            break;
          }
          
          // Brief pause to avoid hammering servers
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        if (foundValidUrl) {
          setVideoUrl(validUrl);
          setRecoveredUrl(validUrl);
          setIsValidUrl(true);
          
          // Register in database
          await registerRecoveredVideo(validUrl, `Vídeo recuperado (${taskIdInput})`, userId, taskIdInput);
          
          toast.success("Vídeo encontrado após verificação manual!");
          
          if (onRecovered) {
            onRecovered(validUrl);
          }
        } else {
          setRecoveredUrl(null);
          setIsValidUrl(false);
          toast.error("Nenhum vídeo encontrado para este ID de tarefa");
        }
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
  
  // Função para verificar uma URL específica da lista de URLs possíveis
  const handleCheckSpecificUrl = async (url: string) => {
    setIsRecovering(true);
    
    try {
      const isValid = await isVideoUrlValid(url);
      
      if (isValid) {
        setVideoUrl(url);
        setRecoveredUrl(url);
        setIsValidUrl(true);
        
        // Register in database
        await registerRecoveredVideo(url, `Vídeo recuperado (URL manual)`, userId);
        
        toast.success("URL válida encontrada!");
        
        if (onRecovered) {
          onRecovered(url);
        }
      } else {
        toast.error(`URL inválida: ${url}`);
      }
    } catch (error) {
      toast.error("Erro ao verificar URL", {
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

  // Função para copiar URL para a área de transferência
  const handleCopyUrl = () => {
    if (!recoveredUrl) return;
    
    try {
      navigator.clipboard.writeText(recoveredUrl);
      setShowUrlCopiedMessage(true);
      toast.success("URL copiada para a área de transferência!");
      
      setTimeout(() => {
        setShowUrlCopiedMessage(false);
      }, 3000);
    } catch (error) {
      toast.error("Erro ao copiar URL", {
        description: "Não foi possível copiar para a área de transferência"
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <RefreshCw className="h-5 w-5 mr-2" />
          {returnUrlOnly ? "Obter URL do Vídeo" : "Recuperação de Vídeos"}
        </CardTitle>
        <CardDescription>
          {returnUrlOnly 
            ? "Encontre a URL direta do vídeo para compartilhar ou incorporar" 
            : "Tente recuperar vídeos gerados usando URL ou ID da tarefa"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="url" className="flex-1">Por URL</TabsTrigger>
            <TabsTrigger value="taskid" className="flex-1">Por ID da Tarefa</TabsTrigger>
          </TabsList>
          
          <TabsContent value="url" className="space-y-4 mt-4">
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
            
            {videoUrl && (
              <Alert variant={isValidUrl === true ? "success" : isValidUrl === false ? "destructive" : "default"}>
                <div className="flex items-center">
                  {isValidUrl === true && <CheckCircle2 className="h-4 w-4 mr-2" />}
                  {isValidUrl === false && <XCircle className="h-4 w-4 mr-2" />}
                  {isValidUrl === null && <RefreshCw className={`h-4 w-4 mr-2 ${isRecovering ? 'animate-spin' : ''}`} />}
                  <AlertTitle>
                    {isValidUrl === true && 'URL Válida!'}
                    {isValidUrl === false && 'URL Inválida'}
                    {isValidUrl === null && 'Verificando...'}
                  </AlertTitle>
                </div>
                <AlertDescription className="mt-2 text-xs">
                  {videoUrl}
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="taskid" className="space-y-4 mt-4">
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
            
            {possibleUrls.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium flex items-center">
                  <List className="h-4 w-4 mr-1" />
                  Possíveis URLs ({possibleUrls.length})
                  {isRecovering && <span className="text-xs ml-2">Verificando {checkedUrlsCount}/{possibleUrls.length}</span>}
                </div>
                <div className="max-h-32 overflow-y-auto space-y-2 rounded-md border border-gray-700 p-2">
                  {possibleUrls.map((url, index) => (
                    <div key={index} className="text-xs flex items-center justify-between">
                      <span className="truncate flex-1">{url}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2"
                        onClick={() => handleCheckSpecificUrl(url)}
                        disabled={isRecovering}
                      >
                        Verificar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Status da verificação */}
        {isValidUrl !== null && !videoUrl && (
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
        
        {/* URL recuperada */}
        {recoveredUrl && (
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium">URL do Vídeo</label>
            <div className="flex items-center gap-2">
              <Input 
                value={recoveredUrl} 
                readOnly 
                className="flex-1 font-mono text-xs"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopyUrl}
                title="Copiar URL"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {showUrlCopiedMessage && (
              <p className="text-xs text-green-500">URL copiada!</p>
            )}
          </div>
        )}
        
        {/* Prévia do vídeo recuperado - mostrar apenas se não estiver no modo URL only */}
        {recoveredUrl && !returnUrlOnly && (
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
          {!returnUrlOnly && (
            <Button
              variant="default"
              size="sm"
              onClick={handleSaveToGallery}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar na Galeria
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default VideoRecoveryTool;
