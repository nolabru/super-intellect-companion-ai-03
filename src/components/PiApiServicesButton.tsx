
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Loader2, 
  Image, 
  KeyRound, 
  Check, 
  AlertCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useAPIFrameImageGeneration } from '@/hooks/useAPIFrameImageGeneration';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Simple function to check if API key exists
const hasApiKey = () => {
  return localStorage.getItem('apiframe_api_key') !== null;
};

// Image model options - agora explicitamente mostra Ideogram e Midjourney
const IMAGE_MODELS = [
  { id: 'ideogram-v2', name: 'Ideogram V2' },
  { id: 'midjourney', name: 'Midjourney' },
];

const PiApiServicesButton = () => {
  const [prompt, setPrompt] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'image' | 'settings'>('image');
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('ideogram-v2');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  
  const { 
    generateImage, 
    isGenerating, 
    progress,
    error
  } = useAPIFrameImageGeneration({
    showToasts: true,
    onComplete: (imageUrl) => {
      setGeneratedImageUrl(imageUrl);
    }
  });
  
  // Initialize API key from localStorage if available
  useEffect(() => {
    if (hasApiKey()) {
      setApiKey('********-****-****-****-************'); // Masked for security
    } else {
      setApiKey('');
    }
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasApiKey()) {
      toast.error('Por favor, configure sua chave de API da API Frame primeiro', {
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
      console.log(`[PiApiServicesButton] Iniciando geração de imagem com prompt: ${prompt} e modelo: ${selectedModel}`);
      
      // Adicionar parâmetros específicos para o modelo
      const params: Record<string, any> = {};
      
      if (selectedModel === 'ideogram-v2') {
        params.style_type = 'GENERAL';
        params.aspect_ratio = 'ASPECT_1_1';
        params.magic_prompt_option = 'AUTO';
      } else if (selectedModel === 'midjourney') {
        params.aspect_ratio = '1:1';
        params.quality = 'standard';
        params.style = 'raw';
      }
      
      // Gerar imagem
      await generateImage(prompt, selectedModel, params);
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      toast.error('Erro ao gerar imagem', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  };

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast.error('Por favor, insira uma chave de API válida');
      return;
    }
    
    // Se a chave foi mascarada, não faça nada
    if (apiKey === '********-****-****-****-************') {
      toast.info('Nenhuma alteração na chave de API');
      return;
    }
    
    localStorage.setItem('apiframe_api_key', apiKey);
    setApiKey('********-****-****-****-************'); // Mask for security
    toast.success('Chave de API configurada com sucesso');
  };
  
  const handleClearApiKey = () => {
    if (confirm('Tem certeza que deseja remover sua chave de API?')) {
      localStorage.removeItem('apiframe_api_key');
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
            data-testid="apiframe-services-button"
          >
            {hasApiKey() ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
            <span>Serviços de API Frame</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium">Geração de Imagem com API Frame</h2>
            <p className="text-sm text-gray-500">
              Gere imagens usando Ideogram ou Midjourney através da API Frame.
            </p>
          </div>
          
          <Tabs 
            defaultValue="image" 
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as any)}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="image" className="flex items-center gap-1">
                <Image className="h-4 w-4" />
                <span>Imagem</span>
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
                  Configure sua chave de API Frame para usar os serviços de geração.
                  {!hasApiKey() && (
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
                        placeholder="Insira sua chave de API"
                        className="flex-1"
                      />
                      {hasApiKey() && (
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
                    disabled={!apiKey.trim() && !hasApiKey()}
                  >
                    Salvar Chave de API
                  </Button>
                  
                  <div className="text-xs text-gray-500 mt-2">
                    <p>Não tem uma chave de API?</p>
                    <p className="mt-1">
                      Você pode obter uma em{' '}
                      <a 
                        href="https://www.apiframe.pro" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        https://www.apiframe.pro
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-4">
                <div className="mb-4 space-y-2">
                  <label htmlFor="modelSelect" className="text-sm font-medium block">Modelo</label>
                  <Select
                    value={selectedModel}
                    onValueChange={setSelectedModel}
                  >
                    <SelectTrigger id="modelSelect">
                      <SelectValue placeholder="Selecione o modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      {IMAGE_MODELS.map(model => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Textarea 
                  placeholder="Descreva a imagem que deseja gerar..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full mb-4"
                  rows={3}
                />
                
                {generatedImageUrl && !isGenerating && (
                  <div className="mb-4">
                    <img 
                      src={generatedImageUrl} 
                      alt="Imagem gerada" 
                      className="w-full h-auto rounded-lg"
                    />
                  </div>
                )}
                
                {isGenerating && (
                  <div className="flex flex-col items-center justify-center py-4 gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <p className="text-sm text-gray-500">
                      Gerando imagem...
                      {progress > 0 && ` ${progress.toFixed(0)}%`}
                    </p>
                  </div>
                )}
                
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 text-sm text-red-600">
                    {error}
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
                    disabled={
                      !prompt.trim() || 
                      isGenerating || 
                      !hasApiKey()
                    }
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        Gerando...
                      </>
                    ) : !hasApiKey() ? (
                      <>
                        <KeyRound className="h-4 w-4 mr-1" />
                        Configurar API
                      </>
                    ) : (
                      'Gerar'
                    )}
                  </Button>
                </div>
                
                {!hasApiKey() && (
                  <div className="mt-4 p-3 bg-amber-50 text-amber-800 text-sm rounded-md border border-amber-200">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                      <p>
                        Você precisa configurar sua chave de API primeiro.{' '}
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

export default PiApiServicesButton;
