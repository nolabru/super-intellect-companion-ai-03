
import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Image, Video, Music } from 'lucide-react';
import { useMediaGeneration } from '@/hooks/useMediaGeneration';
import { toast } from 'sonner';

const PiapiServicesButton = () => {
  const [prompt, setPrompt] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'image' | 'video' | 'audio'>('image');
  
  const imageGeneration = useMediaGeneration({
    showToasts: true
  });
  
  const videoGeneration = useMediaGeneration({
    showToasts: true
  });
  
  const audioGeneration = useMediaGeneration({
    showToasts: true
  });
  
  // Determinar qual instância de geração usar com base na aba ativa
  const getActiveGeneration = () => {
    switch (activeTab) {
      case 'image': return imageGeneration;
      case 'video': return videoGeneration;
      case 'audio': return audioGeneration;
      default: return imageGeneration;
    }
  };
  
  const activeGeneration = getActiveGeneration();
  const currentTask = activeGeneration.currentTask;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast.error('Por favor, insira um prompt');
      return;
    }
    
    try {
      console.log(`[PiapiServicesButton] Iniciando geração de ${activeTab} com prompt: ${prompt}`);
      
      switch (activeTab) {
        case 'image':
          await imageGeneration.generateMedia(prompt, 'image', 'flux-schnell');
          break;
        case 'video':
          await videoGeneration.generateMedia(prompt, 'video', 'kling-text');
          break;
        case 'audio':
          await audioGeneration.generateMedia(prompt, 'audio', 'diffrhythm-base');
          break;
      }
    } catch (error) {
      console.error('Erro ao gerar mídia:', error);
      toast.error('Erro ao gerar mídia', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  };
  
  return (
    <div>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <span>Serviços PiAPI</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium">Geração de Mídia com PiAPI</h2>
            <p className="text-sm text-gray-500">
              Gere imagens, vídeos e áudio usando os serviços da PiAPI.
            </p>
          </div>
          
          <Tabs 
            defaultValue="image" 
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as any)}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="image" className="flex items-center gap-1">
                <Image className="h-4 w-4" />
                <span>Imagem</span>
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center gap-1">
                <Video className="h-4 w-4" />
                <span>Vídeo</span>
              </TabsTrigger>
              <TabsTrigger value="audio" className="flex items-center gap-1">
                <Music className="h-4 w-4" />
                <span>Áudio</span>
              </TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleSubmit} className="p-4">
              <Textarea 
                placeholder={
                  activeTab === 'image' 
                    ? 'Descreva a imagem que deseja gerar...' 
                    : activeTab === 'video'
                      ? 'Descreva o vídeo que deseja gerar...'
                      : 'Descreva o áudio que deseja gerar...'
                }
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full mb-4"
                rows={3}
              />
              
              {currentTask && currentTask.mediaUrl && currentTask.status === 'completed' && (
                <div className="mb-4">
                  {activeTab === 'image' && (
                    <img 
                      src={currentTask.mediaUrl} 
                      alt="Imagem gerada" 
                      className="w-full h-auto rounded-lg"
                    />
                  )}
                  {activeTab === 'video' && (
                    <video 
                      src={currentTask.mediaUrl} 
                      controls
                      className="w-full h-auto rounded-lg"
                    />
                  )}
                  {activeTab === 'audio' && (
                    <audio 
                      src={currentTask.mediaUrl} 
                      controls
                      className="w-full"
                    />
                  )}
                </div>
              )}
              
              {activeGeneration.isGenerating && (
                <div className="flex flex-col items-center justify-center py-4 gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <p className="text-sm text-gray-500">
                    {activeTab === 'image' 
                      ? 'Gerando imagem...' 
                      : activeTab === 'video'
                        ? 'Gerando vídeo...'
                        : 'Gerando áudio...'}
                    {currentTask && currentTask.progress > 0 && ` ${currentTask.progress.toFixed(0)}%`}
                  </p>
                </div>
              )}
              
              {currentTask && currentTask.error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 text-sm text-red-600">
                  {currentTask.error}
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                >
                  Fechar
                </Button>
                <Button 
                  type="submit" 
                  disabled={!prompt.trim() || activeGeneration.isGenerating}
                >
                  {activeGeneration.isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      Gerando...
                    </>
                  ) : (
                    'Gerar'
                  )}
                </Button>
              </div>
            </form>
          </Tabs>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default PiapiServicesButton;
