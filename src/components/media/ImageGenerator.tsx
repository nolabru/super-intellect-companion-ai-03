
import React, { useState, useCallback, useRef } from 'react';
import MediaModelSelector from './MediaModelSelector';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import ReferenceUploader from './ReferenceUploader';
import { MoveVertical, Image, Lightbulb, Paintbrush, Download } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useUnifiedMediaGeneration } from '@/hooks/useUnifiedMediaGeneration';
import { useIsMobile } from '@/hooks/use-mobile';
import MediaPreview from './MediaPreview';

// Define available models
const AVAILABLE_MODELS = [
  { id: 'ideogram', name: 'Ideogram' },
  { id: 'midjourney', name: 'Midjourney' },
  { id: 'gpt4o', name: 'GPT-4o' }
];

// Define aspect ratios
const ASPECT_RATIOS = [
  { id: '1:1', name: '1:1 (Square)' },
  { id: '16:9', name: '16:9 (Landscape)' },
  { id: '9:16', name: '9:16 (Portrait)' },
  { id: '4:5', name: '4:5 (Instagram)' },
  { id: '3:2', name: '3:2 (Standard)' }
];

// Utility function to parse aspect ratio
const parseAspectRatio = (ratio: string) => {
  const [width, height] = ratio.split(':').map(Number);
  return { width, height };
};

interface ImageGeneratorProps {
  onImageGenerated?: (url: string) => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onImageGenerated }) => {
  const [selectedModel, setSelectedModel] = useState('ideogram');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [quality, setQuality] = useState(80);
  const [style, setStyle] = useState('vivid');
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const promptRef = useRef<HTMLTextAreaElement>(null);

  // Use unified media generation hook
  const { 
    generateMedia, 
    isGenerating, 
    currentTask
  } = useUnifiedMediaGeneration();
  
  // Handle progress and status from the currentTask
  const error = currentTask?.error || null;
  const progress = currentTask?.progress || 0;
  
  const handleSubmit = useCallback(async () => {
    if (!prompt.trim()) {
      // Focus on the prompt textarea if empty
      promptRef.current?.focus();
      return;
    }
    
    // Parse the selected aspect ratio
    const { width, height } = parseAspectRatio(aspectRatio);
    
    // Generate the image with the selected model and parameters
    setImageUrl(null); // Clear previous image URL
    
    try {
      // Generate the image
      const taskId = generateMedia('image', prompt, selectedModel, {
        negativePrompt: negativePrompt || undefined,
        width, 
        height,
        quality: quality / 100, // Convert slider value to decimal
        style: style
      }, referenceImage ? URL.createObjectURL(referenceImage) : undefined);
      
      // We'll rely on the currentTask updates to show the generated image
      // The URL will be in currentTask.result when completed
    } catch (err) {
      console.error('Error generating image:', err);
    }
  }, [prompt, selectedModel, negativePrompt, aspectRatio, quality, style, referenceImage, generateMedia]);
  
  // Update imageUrl when task completes
  React.useEffect(() => {
    if (currentTask?.status === 'completed' && currentTask.result) {
      setImageUrl(currentTask.result);
      if (onImageGenerated) {
        onImageGenerated(currentTask.result);
      }
    }
  }, [currentTask, onImageGenerated]);
  
  // Handle model change
  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
  };
  
  // Handle reference image upload
  const handleReferenceUpload = (file: File) => {
    setReferenceImage(file);
  };
  
  // Handle reference image removal
  const handleRemoveReference = () => {
    setReferenceImage(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Model selector */}
          <MediaModelSelector
            models={AVAILABLE_MODELS}
            selectedModel={selectedModel}
            onModelChange={handleModelChange}
            disabled={isGenerating}
          />
          
          {/* Prompt input */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              ref={promptRef}
              id="prompt"
              placeholder="Descreva a imagem que você deseja criar..."
              className="min-h-[120px] bg-inventu-darker border-inventu-gray/30 text-white"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
            />
          </div>
          
          {/* Aspect ratio selector */}
          <div className="space-y-2">
            <Label htmlFor="aspectRatio">Proporção</Label>
            <Select
              value={aspectRatio}
              onValueChange={setAspectRatio}
              disabled={isGenerating}
            >
              <SelectTrigger id="aspectRatio" className="bg-inventu-darker border-inventu-gray/30">
                <MoveVertical className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Escolha uma proporção" />
              </SelectTrigger>
              <SelectContent className="bg-inventu-dark border-inventu-gray/30">
                {ASPECT_RATIOS.map((ratio) => (
                  <SelectItem key={ratio.id} value={ratio.id}>
                    {ratio.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Conditional controls based on selected model */}
          {selectedModel === 'midjourney' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quality">Qualidade</Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    id="quality"
                    min={1}
                    max={100}
                    step={1}
                    value={[quality]}
                    onValueChange={(values) => setQuality(values[0])}
                    disabled={isGenerating}
                    className="flex-1"
                  />
                  <span className="text-sm text-white/70 w-8 text-center">{quality}%</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="style">Estilo</Label>
                <Select
                  value={style}
                  onValueChange={setStyle}
                  disabled={isGenerating}
                >
                  <SelectTrigger id="style" className="bg-inventu-darker border-inventu-gray/30">
                    <Paintbrush className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Escolha um estilo" />
                  </SelectTrigger>
                  <SelectContent className="bg-inventu-dark border-inventu-gray/30">
                    <SelectItem value="vivid">Vivid</SelectItem>
                    <SelectItem value="natural">Natural</SelectItem>
                    <SelectItem value="raw">Raw</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          {/* Reference image upload */}
          <div className="space-y-2">
            <Label>Imagem de Referência (opcional)</Label>
            <ReferenceUploader
              label="Imagem de Referência"
              onReferenceUpdate={(url) => {
                // This handles both setting and clearing the reference
                if (url) {
                  fetch(url)
                    .then(response => response.blob())
                    .then(blob => {
                      const file = new File([blob], "reference.png", { type: "image/png" });
                      setReferenceImage(file);
                    })
                    .catch(err => console.error("Error converting URL to File:", err));
                } else {
                  setReferenceImage(null);
                }
              }}
              disabled={isGenerating}
            />
          </div>
          
          {/* Negative prompt for supported models */}
          {(selectedModel === 'ideogram' || selectedModel === 'midjourney') && (
            <div className="space-y-2">
              <Label htmlFor="negativePrompt">Negative Prompt (opcional)</Label>
              <Textarea
                id="negativePrompt"
                placeholder="Elementos que você NÃO quer na imagem..."
                className="min-h-[80px] bg-inventu-darker border-inventu-gray/30 text-white"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                disabled={isGenerating}
              />
            </div>
          )}
          
          {/* Generate button */}
          <Button 
            onClick={handleSubmit} 
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
          >
            <Image className="h-4 w-4 mr-2" />
            {isGenerating ? 'Gerando...' : 'Gerar Imagem'}
          </Button>
          
          {/* Error message */}
          {error && (
            <div className="text-red-500 text-sm mt-2">
              Erro: {error}
            </div>
          )}
        </div>
        
        {/* Preview area */}
        <div>
          <Card className="bg-inventu-gray/10 border-inventu-gray/20">
            <CardContent className="p-4">
              {imageUrl ? (
                <div className="space-y-4">
                  <MediaPreview 
                    mediaUrl={imageUrl} 
                    mediaType="image"
                  />
                  
                  <div className="flex justify-center">
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(imageUrl, '_blank')}
                      className="mr-2"
                    >
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = imageUrl;
                        link.download = `image-${Date.now()}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-center text-white/50">
                  {isGenerating ? (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 border-2 border-white/20 border-t-white/80 rounded-full animate-spin mb-4"></div>
                      <p>Gerando imagem... {typeof progress === 'number' ? `${Math.round(progress * 100)}%` : ''}</p>
                    </div>
                  ) : (
                    <>
                      <Image className="h-12 w-12 mb-4 opacity-30" />
                      <p>Sua imagem gerada aparecerá aqui</p>
                      <p className="text-xs mt-2">
                        Crie uma imagem usando os controles à esquerda
                      </p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
