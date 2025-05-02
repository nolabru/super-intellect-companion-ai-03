import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Loader2, 
  Image, 
  Video, 
  Music, 
  KeyRound, 
  Check, 
  AlertCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

// Utility function to check if PiAPI key is configured
const hasPiapiApiKey = (): boolean => {
  return !!localStorage.getItem('piapi_api_key');
};

const PiapiServicesButton = () => {
  const [prompt, setPrompt] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'audio' | 'settings'>('image');
  const [apiKey, setApiKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTask, setCurrentTask] = useState<any>(null);
  
  // Initialize API key from localStorage if available
  useEffect(() => {
    if (hasPiapiApiKey()) {
      setApiKey('********-****-****-****-************'); // Masked for security
    } else {
      setApiKey('');
    }
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasPiapiApiKey()) {
      toast.error('Por favor, configure sua chave de API da PiAPI primeiro', {
        description: 'Acesse a aba de configurações para inserir sua chave de API'
      });
      setActiveTab('settings');
      return;
    }
    
    if (!prompt.trim()) {
      toast.error('Por favor, insira um prompt');
      return;
    }
    
    try {
      console.log(`[PiapiServicesButton] Iniciando geração de ${activeTab} com prompt: ${prompt}`);
      setIsGenerating(true);
      
      // Simulate generation process
      setTimeout(() => {
        toast.info('Esta funcionalidade foi desativada nesta versão');
        setIsGenerating(false);
      }, 2000);
    } catch (error) {
      console.error('Erro ao gerar mídia:', error);
      toast.error('Erro ao gerar mídia', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      setIsGenerating(false);
    }
  };

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast.error('Por favor, insira uma chave de API válida');
      return;
    }
    
    try {
      localStorage.setItem('piapi_api_key', apiKey);
      setApiKey('********-****-****-****-************'); // Mask for security
      toast.success('Chave de API configurada com sucesso');
    } catch (error) {
      toast.error('Erro ao salvar chave de API');
    }
  };
  
  const handleClearApiKey = () => {
    if (confirm('Tem certeza que deseja remover sua chave de API?')) {
      localStorage.removeItem('piapi_api_key');
      setApiKey('');
      toast.info('Chave de API removida');
    }
  };
  
  return (
    <div>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1" 
            data-testid="piapi-services-button"
          >
            {hasPiapiApiKey() ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
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
            <TabsList className="grid grid-cols-4 w-full">
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
              <TabsTrigger value="settings" className="flex items-center gap-1">
                <KeyRound className="h-4 w-4" />
                <span>API</span>
              </TabsTrigger>
            </TabsList>
            
            {activeTab === 'settings' ? (
              <div className="p-4">
                <h3 className="text-sm font-medium mb-2">Configuração da API</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Configure sua chave de API da PiAPI para usar os serviços de geração.
                  {!hasPiapiApiKey() && (
                    <span className="block mt-1 text-amber-500">
                      <AlertCircle className="h-3 w-3 inline-block mr-1" />
                      API não configurada
                    </span>
                  )}
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="apiKey" className="text-sm font-medium block mb-1">
                      Chave de API
                    </label>
                    <div className="flex gap-2">
                      <Input
                        id="apiKey"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Insira sua chave de API da PiAPI"
                        className="flex-1"
                      />
                      {hasPiapiApiKey() && (
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={handleClearApiKey}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleSaveApiKey} 
                    disabled={!apiKey.trim()}
                  >
                    Salvar Chave de API
                  </Button>
                  
                  <div className="text-xs text-gray-500 mt-2">
                    <p>Não tem uma chave de API da PiAPI?</p>
                    <p className="mt-1">
                      Você pode obter uma em{' '}
                      <a 
                        href="https://piapi.ai" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        https://piapi.ai
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
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
                
                {isGenerating && (
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
                  
                  {isGenerating && currentTask ? (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {}}
                    >
                      Cancelar
                    </Button>
                  ) : (
                    <Button 
                      type="submit" 
                      disabled={
                        !prompt.trim() || 
                        isGenerating || 
                        !hasPiapiApiKey()
                      }
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          Gerando...
                        </>
                      ) : !hasPiapiApiKey() ? (
                        <>
                          <KeyRound className="h-4 w-4 mr-1" />
                          Configurar API
                        </>
                      ) : (
                        'Gerar'
                      )}
                    </Button>
                  )}
                </div>
                
                {!hasPiapiApiKey() && (
                  <div className="mt-4 p-3 bg-amber-50 text-amber-800 text-sm rounded-md border border-amber-200">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                      <p>
                        Você precisa configurar sua chave de API da PiAPI primeiro.{' '}
                        <button
                          type="button"
                          className="text-blue-600 hover:underline"
                          onClick={() => setActiveTab('settings')}
                        >
                          Clique aqui para configurar.
                        </button>
                      </p>
                    </div>
                  </div>
                )}
              </form>
            )}
          </Tabs>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default PiapiServicesButton;
