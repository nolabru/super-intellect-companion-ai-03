
import React, { useState } from 'react';
import UnifiedMediaGenerator from './UnifiedMediaGenerator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAPIFrameImageGeneration } from '@/hooks/useAPIFrameImageGeneration';

// Updated image models data - now all under API Frame
const IMAGE_MODELS = [
  { id: 'ideogram-v2', name: 'Ideogram V2' },
  { id: 'midjourney', name: 'Midjourney' }
];

// Ideogram style types
const IDEOGRAM_STYLES = [
  { id: 'GENERAL', name: 'General' },
  { id: 'ANIME', name: 'Anime' },
  { id: 'ILLUSTRATION', name: 'Illustration' },
  { id: 'PHOTOGRAPHY', name: 'Photography' },
  { id: 'PIXEL_ART', name: 'Pixel Art' },
  { id: 'COMIC_BOOK', name: 'Comic Book' },
  { id: 'CRAFT_CLAY', name: 'Craft Clay' },
  { id: 'DIGITAL_ART', name: 'Digital Art' },
  { id: 'ENHANCE', name: 'Enhance' },
  { id: 'FANTASY_ART', name: 'Fantasy Art' },
  { id: 'ISOMETRIC', name: 'Isometric' },
  { id: 'LINE_ART', name: 'Line Art' },
  { id: 'NEON_PUNK', name: 'Neon Punk' },
  { id: 'ORIGAMI', name: 'Origami' },
  { id: 'PHOTOGRAPHIC', name: 'Photographic' },
  { id: 'CINEMATIC', name: 'Cinematic' },
  { id: '3D_MODEL', name: '3D Model' },
];

// Aspect ratios
const ASPECT_RATIOS = [
  { id: 'ASPECT_1_1', name: '1:1 Square', midjourney: '1:1' },
  { id: 'ASPECT_16_9', name: '16:9 Landscape', midjourney: '16:9' },
  { id: 'ASPECT_9_16', name: '9:16 Portrait', midjourney: '9:16' },
  { id: 'ASPECT_4_3', name: '4:3 Classic', midjourney: '4:3' },
  { id: 'ASPECT_3_2', name: '3:2 Classic', midjourney: '3:2' },
];

// Midjourney specific options
const MIDJOURNEY_QUALITY_OPTIONS = [
  { id: 'standard', name: 'Standard' },
  { id: 'hd', name: 'HD' }
];

const MIDJOURNEY_STYLE_OPTIONS = [
  { id: 'raw', name: 'Raw' },
  { id: 'cute', name: 'Cute' },
  { id: 'scenic', name: 'Scenic' },
  { id: 'original', name: 'Original' }
];

interface ImageGeneratorProps {
  onImageGenerated?: (imageUrl: string) => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onImageGenerated }) => {
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(IMAGE_MODELS[0].id);
  const [ideogramStyle, setIdeogramStyle] = useState('GENERAL');
  const [aspectRatio, setAspectRatio] = useState('ASPECT_1_1');
  const [magicPrompt, setMagicPrompt] = useState('AUTO');
  const [prompt, setPrompt] = useState('');
  
  // Midjourney specific states
  const [mjQuality, setMjQuality] = useState('standard');
  const [mjStyle, setMjStyle] = useState('raw');
  
  const isMidjourney = selectedModel === 'midjourney';
  
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
  
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Por favor, insira um prompt para a geração de imagem');
      return;
    }
    
    // Verificar se existe uma chave de API 
    const apiKeyFromStorage = localStorage.getItem('apiframe_api_key');
    if (!apiKeyFromStorage) {
      toast.error('API Frame API Key não configurada', {
        description: 'Acesse as configurações para adicionar sua chave de API'
      });
      return;
    }
    
    // Preparar parâmetros com base no modelo selecionado
    const params = getAdditionalParams();
    
    // Gerar imagem
    await generateImage(prompt, selectedModel, params);
  };
  
  const ParamControls = () => (
    <div className="space-y-4">
      {/* Model selection */}
      <div className="space-y-2">
        <Label htmlFor="modelSelect">Modelo</Label>
        <Select 
          value={selectedModel}
          onValueChange={setSelectedModel}
        >
          <SelectTrigger id="modelSelect">
            <SelectValue placeholder="Selecione o modelo" />
          </SelectTrigger>
          <SelectContent>
            {IMAGE_MODELS.map(model => (
              <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Aspect Ratio - common for both */}
      <div className="space-y-2">
        <Label htmlFor="aspectRatio">Proporção</Label>
        <Select 
          value={aspectRatio}
          onValueChange={setAspectRatio}
        >
          <SelectTrigger id="aspectRatio">
            <SelectValue placeholder="Selecione a proporção" />
          </SelectTrigger>
          <SelectContent>
            {ASPECT_RATIOS.map(ratio => (
              <SelectItem key={ratio.id} value={ratio.id}>{ratio.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ideogram specific controls */}
      {!isMidjourney && (
        <>
          <div className="space-y-2">
            <Label htmlFor="ideogramStyle">Estilo</Label>
            <Select 
              value={ideogramStyle}
              onValueChange={setIdeogramStyle}
            >
              <SelectTrigger id="ideogramStyle">
                <SelectValue placeholder="Selecione o estilo" />
              </SelectTrigger>
              <SelectContent>
                {IDEOGRAM_STYLES.map(style => (
                  <SelectItem key={style.id} value={style.id}>{style.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="magicPrompt">Magic Prompt</Label>
            <Select 
              value={magicPrompt}
              onValueChange={setMagicPrompt}
            >
              <SelectTrigger id="magicPrompt">
                <SelectValue placeholder="Selecione a opção de magic prompt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AUTO">Auto</SelectItem>
                <SelectItem value="ON">Ligado</SelectItem>
                <SelectItem value="OFF">Desligado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
      
      {/* Midjourney specific controls */}
      {isMidjourney && (
        <>
          <div className="space-y-2">
            <Label htmlFor="mjQuality">Qualidade</Label>
            <Select 
              value={mjQuality}
              onValueChange={setMjQuality}
            >
              <SelectTrigger id="mjQuality">
                <SelectValue placeholder="Selecione a qualidade" />
              </SelectTrigger>
              <SelectContent>
                {MIDJOURNEY_QUALITY_OPTIONS.map(option => (
                  <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="mjStyle">Estilo</Label>
            <Select 
              value={mjStyle}
              onValueChange={setMjStyle}
            >
              <SelectTrigger id="mjStyle">
                <SelectValue placeholder="Selecione o estilo" />
              </SelectTrigger>
              <SelectContent>
                {MIDJOURNEY_STYLE_OPTIONS.map(option => (
                  <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Negative prompt - common for both */}
      <div className="space-y-2">
        <Label htmlFor="negativePrompt">Prompt Negativo (Opcional)</Label>
        <Textarea
          id="negativePrompt"
          placeholder="Elementos a serem evitados na imagem"
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
        />
      </div>
      
      {/* Prompt input */}
      <div className="space-y-2">
        <Label htmlFor="prompt">Prompt</Label>
        <Textarea
          id="prompt"
          placeholder="Descreva a imagem que você deseja gerar..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="resize-none"
        />
      </div>
    </div>
  );

  // Create additional params object based on selected model
  const getAdditionalParams = () => {
    if (isMidjourney) {
      // Find the corresponding Midjourney format for the selected aspect ratio
      const selectedRatio = ASPECT_RATIOS.find(r => r.id === aspectRatio);
      const mjAspectRatio = selectedRatio ? selectedRatio.midjourney : '1:1';
      
      return {
        negative_prompt: negativePrompt,
        quality: mjQuality,
        aspect_ratio: mjAspectRatio,
        style: mjStyle
      };
    } else {
      // Ideogram params
      return {
        negative_prompt: negativePrompt,
        style_type: ideogramStyle,
        aspect_ratio: aspectRatio,
        magic_prompt_option: magicPrompt,
      };
    }
  };

  // Check if API key is configured
  const isApiKeyConfigured = () => {
    return localStorage.getItem('apiframe_api_key') !== null;
  };

  return (
    <div className="w-full max-w-3xl p-4 bg-inventu-darker rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-white">Gerador de Imagens IA</h2>
      
      <div className="mb-6">
        <ParamControls />
      </div>
      
      {generatedImageUrl && !isGenerating && (
        <div className="mb-4">
          <div className="relative rounded-lg overflow-hidden border border-inventu-gray/30">
            <img 
              src={generatedImageUrl} 
              alt="Imagem gerada" 
              className="w-full h-auto object-contain bg-inventu-darker" 
            />
          </div>
        </div>
      )}
      
      {error && !isGenerating && (
        <div className="p-3 bg-red-800/30 border border-red-500/30 rounded-md mb-4 text-red-200">
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {isGenerating && (
        <div className="mb-4">
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
      
      {!isApiKeyConfigured() && (
        <div className="p-3 bg-yellow-800/30 border border-yellow-500/30 rounded-md mb-4 text-yellow-200">
          <p className="text-sm">
            API Key da API Frame não configurada. Configure-a em Configurações/API.
          </p>
        </div>
      )}
      
      <button
        className="w-full py-2 px-4 bg-inventu-blue hover:bg-inventu-blue/80 text-white font-medium rounded-md transition-colors disabled:bg-inventu-gray/30 disabled:text-white/50"
        onClick={handleGenerate}
        disabled={!prompt.trim() || isGenerating || !isApiKeyConfigured()}
      >
        {isGenerating ? 'Gerando...' : 'Gerar Imagem'}
      </button>
    </div>
  );
};

export default ImageGenerator;
