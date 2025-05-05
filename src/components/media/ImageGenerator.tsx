
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';
import { useAPIFrameImageGeneration } from '@/hooks/useAPIFrameImageGeneration';

// Image models disponíveis
const IMAGE_MODELS = [
  { id: 'ideogram-v2', name: 'Ideogram V2', provider: 'apiframe' },
  { id: 'midjourney', name: 'Midjourney', provider: 'apiframe' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' }
];

// Estilos Ideogram
const IDEOGRAM_STYLES = [
  { id: 'GENERAL', name: 'Geral' },
  { id: 'ANIME', name: 'Anime' },
  { id: 'ILLUSTRATION', name: 'Ilustração' },
  { id: 'PHOTOGRAPHY', name: 'Fotografia' },
  { id: 'PIXEL_ART', name: 'Pixel Art' },
  { id: 'COMIC_BOOK', name: 'Quadrinhos' },
  { id: 'DIGITAL_ART', name: 'Arte Digital' },
  { id: 'FANTASY_ART', name: 'Arte Fantástica' },
  { id: 'CINEMATIC', name: 'Cinemático' },
  { id: '3D_MODEL', name: 'Modelo 3D' }
];

// Proporções de aspecto
const ASPECT_RATIOS = [
  { id: 'ASPECT_1_1', name: '1:1 Quadrado', midjourney: '1:1' },
  { id: 'ASPECT_16_9', name: '16:9 Paisagem', midjourney: '16:9' },
  { id: 'ASPECT_9_16', name: '9:16 Retrato', midjourney: '9:16' },
  { id: 'ASPECT_4_3', name: '4:3 Clássico', midjourney: '4:3' }
];

// Opções específicas do Midjourney
const MIDJOURNEY_QUALITY_OPTIONS = [
  { id: 'standard', name: 'Padrão' },
  { id: 'hd', name: 'HD' }
];

const MIDJOURNEY_STYLE_OPTIONS = [
  { id: 'raw', name: 'Natural' },
  { id: 'cute', name: 'Fofo' },
  { id: 'scenic', name: 'Cênico' },
  { id: 'original', name: 'Original' }
];

interface ImageGeneratorProps {
  onImageGenerated?: (imageUrl: string) => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onImageGenerated }) => {
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('ideogram-v2');
  const [ideogramStyle, setIdeogramStyle] = useState('GENERAL');
  const [aspectRatio, setAspectRatio] = useState('ASPECT_1_1');
  const [prompt, setPrompt] = useState('');
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  
  // Estados específicos do Midjourney
  const [mjQuality, setMjQuality] = useState('standard');
  const [mjStyle, setMjStyle] = useState('raw');
  
  const isMidjourney = selectedModel === 'midjourney';
  const isIdeogram = selectedModel === 'ideogram-v2';
  const isAPIFrameModel = selectedModel === 'ideogram-v2' || selectedModel === 'midjourney';
  
  const { 
    generateImage, 
    isGenerating, 
    generatedImageUrl, 
    progress, 
    error 
  } = useAPIFrameImageGeneration({
    showToasts: true,
    onComplete: (imageUrl) => {
      if (onImageGenerated) {
        onImageGenerated(imageUrl);
      }
    }
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceFile(file);
      const url = URL.createObjectURL(file);
      setReferenceImageUrl(url);
    }
  };

  const handleRemoveReferenceImage = () => {
    if (referenceImageUrl) {
      URL.revokeObjectURL(referenceImageUrl);
    }
    setReferenceImageUrl(null);
    setReferenceFile(null);
  };
  
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Por favor, insira um prompt para a geração de imagem');
      return;
    }
    
    // Verificar se existe uma chave de API (somente para modelos API Frame)
    if (isAPIFrameModel) {
      const apiKeyFromStorage = localStorage.getItem('apiframe_api_key');
      if (!apiKeyFromStorage) {
        toast.error('API Frame API Key não configurada', {
          description: 'Configure sua chave nas configurações'
        });
        
        // Solicitar API Key
        const apiKey = prompt('Insira sua API Frame API Key:');
        if (apiKey) {
          localStorage.setItem('apiframe_api_key', apiKey);
        } else {
          return;
        }
      }
    }
    
    // Preparar parâmetros com base no modelo selecionado
    const params: any = {};
    
    if (isIdeogram) {
      params.style_type = ideogramStyle;
      params.aspect_ratio = aspectRatio;
      params.negative_prompt = negativePrompt;
      params.magic_prompt_option = 'AUTO';
    } else if (isMidjourney) {
      // Encontrar o formato correspondente do Midjourney para a proporção selecionada
      const selectedRatio = ASPECT_RATIOS.find(r => r.id === aspectRatio);
      const mjAspectRatio = selectedRatio ? selectedRatio.midjourney : '1:1';
      
      params.negative_prompt = negativePrompt;
      params.quality = mjQuality;
      params.aspect_ratio = mjAspectRatio;
      params.style = mjStyle;
    }
    
    // Adicionar imagem de referência se estiver presente
    if (referenceFile) {
      params.referenceFile = referenceFile;
    }
    
    if (isAPIFrameModel) {
      // Gerar imagem usando API Frame (Ideogram/Midjourney)
      await generateImage(prompt, selectedModel, params);
    } else {
      // Aqui você pode adicionar a integração com outros modelos (OpenAI, etc)
      toast.info(`Gerando imagem com ${selectedModel}`, {
        description: "Esta funcionalidade será implementada em breve."
      });
    }
  };

  // Checar se a API key está configurada (somente para modelos API Frame)
  const isApiKeyConfigured = () => {
    if (!isAPIFrameModel) return true;
    return localStorage.getItem('apiframe_api_key') !== null;
  };

  return (
    <Card className="bg-inventu-darker border-inventu-gray/30">
      <CardHeader className="px-6 pt-6 pb-2">
        <h2 className="text-xl font-semibold text-white">Gerador de Imagens</h2>
      </CardHeader>
      
      <CardContent className="px-6 py-4 space-y-6">
        {/* Seleção de modelo */}
        <div className="space-y-2">
          <Label htmlFor="modelSelector" className="text-white">Modelo</Label>
          <Select 
            value={selectedModel}
            onValueChange={setSelectedModel}
          >
            <SelectTrigger id="modelSelector" className="bg-inventu-card border-inventu-gray/30 text-white">
              <SelectValue placeholder="Selecione um modelo">
                {IMAGE_MODELS.find(m => m.id === selectedModel)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-inventu-dark border-inventu-gray/30">
              {IMAGE_MODELS.map(model => (
                <SelectItem key={model.id} value={model.id} className="text-white hover:bg-white/10">
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Controles específicos para cada modelo */}
        <div className="space-y-4">
          {/* Proporção de Aspecto - comum para todos os modelos */}
          <div className="space-y-2">
            <Label htmlFor="aspectRatio" className="text-white">Proporção</Label>
            <Select 
              value={aspectRatio}
              onValueChange={setAspectRatio}
            >
              <SelectTrigger id="aspectRatio" className="bg-inventu-card border-inventu-gray/30 text-white">
                <SelectValue placeholder="Selecione a proporção">
                  {ASPECT_RATIOS.find(ratio => ratio.id === aspectRatio)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-inventu-dark border-inventu-gray/30">
                {ASPECT_RATIOS.map(ratio => (
                  <SelectItem key={ratio.id} value={ratio.id} className="text-white hover:bg-white/10">
                    {ratio.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Controles específicos do Ideogram */}
          {isIdeogram && (
            <div className="space-y-2">
              <Label htmlFor="ideogramStyle" className="text-white">Estilo</Label>
              <Select 
                value={ideogramStyle}
                onValueChange={setIdeogramStyle}
              >
                <SelectTrigger id="ideogramStyle" className="bg-inventu-card border-inventu-gray/30 text-white">
                  <SelectValue placeholder="Selecione o estilo">
                    {IDEOGRAM_STYLES.find(style => style.id === ideogramStyle)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-inventu-dark border-inventu-gray/30">
                  {IDEOGRAM_STYLES.map(style => (
                    <SelectItem key={style.id} value={style.id} className="text-white hover:bg-white/10">
                      {style.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Controles específicos do Midjourney */}
          {isMidjourney && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mjQuality" className="text-white">Qualidade</Label>
                <Select 
                  value={mjQuality}
                  onValueChange={setMjQuality}
                >
                  <SelectTrigger id="mjQuality" className="bg-inventu-card border-inventu-gray/30 text-white">
                    <SelectValue placeholder="Selecione a qualidade">
                      {MIDJOURNEY_QUALITY_OPTIONS.find(option => option.id === mjQuality)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-inventu-dark border-inventu-gray/30">
                    {MIDJOURNEY_QUALITY_OPTIONS.map(option => (
                      <SelectItem key={option.id} value={option.id} className="text-white hover:bg-white/10">
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mjStyle" className="text-white">Estilo</Label>
                <Select 
                  value={mjStyle}
                  onValueChange={setMjStyle}
                >
                  <SelectTrigger id="mjStyle" className="bg-inventu-card border-inventu-gray/30 text-white">
                    <SelectValue placeholder="Selecione o estilo">
                      {MIDJOURNEY_STYLE_OPTIONS.find(option => option.id === mjStyle)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-inventu-dark border-inventu-gray/30">
                    {MIDJOURNEY_STYLE_OPTIONS.map(option => (
                      <SelectItem key={option.id} value={option.id} className="text-white hover:bg-white/10">
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Imagem de referência (opcional) */}
          <div className="space-y-2">
            <Label className="text-white">Imagem de Referência (opcional)</Label>
            
            {!referenceImageUrl ? (
              <div className="border-2 border-dashed border-inventu-gray/30 rounded-md p-4 text-center cursor-pointer hover:bg-inventu-card transition-colors"
                   onClick={() => document.getElementById('reference-upload')?.click()}>
                <Upload className="mx-auto h-8 w-8 text-white/40" />
                <p className="mt-2 text-sm text-white/60">Clique para fazer upload de uma imagem de referência</p>
                <input
                  id="reference-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="relative">
                <img 
                  src={referenceImageUrl} 
                  alt="Imagem de referência" 
                  className="w-full max-h-64 object-contain rounded-md border border-inventu-gray/30" 
                />
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="absolute top-2 right-2"
                  onClick={handleRemoveReferenceImage}
                >
                  Remover
                </Button>
              </div>
            )}
          </div>

          {/* Prompt negativo - comum para ambos */}
          <div className="space-y-2">
            <Label htmlFor="negativePrompt" className="text-white">Prompt Negativo (Opcional)</Label>
            <Textarea
              id="negativePrompt"
              placeholder="Elementos a serem evitados na imagem"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              className="bg-inventu-card border-inventu-gray/30 text-white resize-none h-16"
            />
          </div>
        </div>
        
        {/* Prompt principal */}
        <div className="space-y-2">
          <Label htmlFor="prompt" className="text-white">Prompt</Label>
          <Textarea
            id="prompt"
            placeholder="Descreva a imagem que você deseja gerar..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="bg-inventu-card border-inventu-gray/30 text-white resize-none"
          />
        </div>
        
        {/* Prévia da imagem gerada */}
        {generatedImageUrl && !isGenerating && (
          <div className="rounded-lg overflow-hidden border border-inventu-gray/30">
            <img 
              src={generatedImageUrl} 
              alt="Imagem gerada" 
              className="w-full h-auto max-h-[500px] object-contain bg-black" 
            />
          </div>
        )}
        
        {/* Mensagem de erro */}
        {error && !isGenerating && (
          <div className="p-3 bg-red-800/30 border border-red-500/30 rounded-md text-red-200">
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {/* Progresso da geração */}
        {isGenerating && (
          <div>
            <div className="w-full bg-inventu-gray/20 rounded-full h-2.5">
              <div 
                className="bg-inventu-blue h-2.5 rounded-full" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-white/60 mt-2 text-center">
              Gerando imagem... {progress}%
            </p>
          </div>
        )}
        
        {/* Aviso de API Key não configurada */}
        {!isApiKeyConfigured() && (
          <div className="p-3 bg-yellow-800/30 border border-yellow-500/30 rounded-md text-yellow-200">
            <p className="text-sm">
              API Key da API Frame não configurada. Configure-a ou clique em gerar para configurar.
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="px-6 py-4">
        <Button
          className="w-full bg-inventu-blue hover:bg-inventu-blue/80 text-white"
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando...
            </>
          ) : (
            'Gerar Imagem'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ImageGenerator;
