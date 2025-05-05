import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Ideogram models
const IDEOGRAM_MODELS = [
  { id: 'V_2', name: 'Version 2 (Stable)' },
  { id: 'V_2_TURBO', name: 'Version 2 Turbo (Fast)' },
];

// Ideogram style types
const STYLE_TYPES = [
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
  { id: 'ASPECT_1_1', name: '1:1 Square' },
  { id: 'ASPECT_16_9', name: '16:9 Landscape' },
  { id: 'ASPECT_9_16', name: '9:16 Portrait' },
  { id: 'ASPECT_4_3', name: '4:3 Classic' },
  { id: 'ASPECT_3_2', name: '3:2 Classic' },
];

interface IdeogramGeneratorProps {
  onImageGenerated?: (imageUrl: string) => void;
}

const IdeogramGenerator: React.FC<IdeogramGeneratorProps> = ({ onImageGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(IDEOGRAM_MODELS[0].id); // Default to V_2
  const [styleType, setStyleType] = useState(STYLE_TYPES[0].id);
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0].id);
  const [magicPrompt, setMagicPrompt] = useState('AUTO');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Por favor, forneça um prompt para a geração de imagem.');
      return;
    }

    setIsGenerating(true);
    setGeneratedImages([]);
    
    try {
      // Prepare request body for Edge Function
      const requestBody = {
        prompt,
        model: selectedModel,
        style_type: styleType,
        negative_prompt: negativePrompt,
        aspect_ratio: aspectRatio,
        magic_prompt_option: magicPrompt
      };
      
      console.log('Gerando imagem com Ideogram:', requestBody);
      
      // Call Edge Function - UPDATED to use apiframe-ideogram-imagine
      const { data, error } = await supabase.functions.invoke('apiframe-ideogram-imagine', {
        body: requestBody
      });
      
      if (error) {
        console.error('Erro na função Edge Ideogram:', error);
        toast.error('Erro ao gerar imagem', {
          description: error.message || 'Tente novamente mais tarde.'
        });
        return;
      }
      
      if (!data.success || !data.images || data.images.length === 0) {
        console.error('Resposta inválida do Ideogram:', data);
        toast.error('Não foi possível gerar a imagem', {
          description: data.error || 'Tente um prompt diferente.'
        });
        return;
      }
      
      // Set generated images
      setGeneratedImages(data.images);
      
      // Call callback with first image if provided
      if (onImageGenerated && data.images.length > 0) {
        onImageGenerated(data.images[0]);
      }
      
      toast.success('Imagem gerada com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar imagem:', err);
      toast.error('Erro inesperado', {
        description: err instanceof Error ? err.message : 'Tente novamente mais tarde.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ImageIcon className="h-5 w-5" />
          <span>Ideogram AI Image Generator</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="model">Modelo</Label>
            <Select 
              value={selectedModel}
              onValueChange={(value) => setSelectedModel(value)}
              disabled={isGenerating}
            >
              <SelectTrigger id="model">
                <SelectValue placeholder="Selecione o modelo" />
              </SelectTrigger>
              <SelectContent>
                {IDEOGRAM_MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="styleType">Estilo</Label>
            <Select 
              value={styleType}
              onValueChange={(value) => setStyleType(value)}
              disabled={isGenerating}
            >
              <SelectTrigger id="styleType">
                <SelectValue placeholder="Selecione o estilo" />
              </SelectTrigger>
              <SelectContent>
                {STYLE_TYPES.map((style) => (
                  <SelectItem key={style.id} value={style.id}>
                    {style.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="aspectRatio">Proporção</Label>
            <Select 
              value={aspectRatio}
              onValueChange={(value) => setAspectRatio(value)}
              disabled={isGenerating}
            >
              <SelectTrigger id="aspectRatio">
                <SelectValue placeholder="Selecione a proporção" />
              </SelectTrigger>
              <SelectContent>
                {ASPECT_RATIOS.map((ratio) => (
                  <SelectItem key={ratio.id} value={ratio.id}>
                    {ratio.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="magicPrompt">Magic Prompt</Label>
            <Select 
              value={magicPrompt}
              onValueChange={(value) => setMagicPrompt(value)}
              disabled={isGenerating}
            >
              <SelectTrigger id="magicPrompt">
                <SelectValue placeholder="Magic Prompt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AUTO">Auto</SelectItem>
                <SelectItem value="ON">Ligado</SelectItem>
                <SelectItem value="OFF">Desligado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="prompt">Prompt</Label>
          <Textarea
            id="prompt"
            placeholder="Descreva a imagem que você deseja gerar..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            disabled={isGenerating}
            className="resize-none"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="negativePrompt">Prompt Negativo (opcional)</Label>
          <Textarea
            id="negativePrompt"
            placeholder="Elementos que você NÃO quer na imagem..."
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            rows={2}
            disabled={isGenerating}
            className="resize-none"
          />
        </div>
        
        {generatedImages.length > 0 && !isGenerating && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {generatedImages.map((imageUrl, index) => (
              <div key={index} className="border rounded-md overflow-hidden">
                <img 
                  src={imageUrl} 
                  alt={`Generated ${index + 1}`}
                  className="w-full h-auto object-contain" 
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="w-full"
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

export default IdeogramGenerator;
