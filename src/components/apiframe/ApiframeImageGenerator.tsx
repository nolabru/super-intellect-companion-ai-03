
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { useImageGeneration } from '@/hooks/apiframe/useImageGeneration';
import { ApiframeParams, MediaGenerationResult } from '@/types/apiframeGeneration';
import ApiframeConfig from './ApiframeConfig';
import { Progress } from '@/components/ui/progress';

// Updated model list based on APIframe.ai's supported models
const IMAGE_MODELS = [
  { id: 'sdxl', name: 'Stable Diffusion XL' },
  { id: 'sdxl-turbo', name: 'SDXL Turbo' },
  { id: 'kandinsky', name: 'Kandinsky' },
  { id: 'deepfloyd', name: 'DeepFloyd' }
];

interface ApiframeImageGeneratorProps {
  onImageGenerated?: (imageUrl: string) => void;
}

const ApiframeImageGenerator: React.FC<ApiframeImageGeneratorProps> = ({ onImageGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(IMAGE_MODELS[0].id);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const { generateImage, isGenerating, isApiKeyConfigured, currentTask } = useImageGeneration();
  
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      return;
    }

    const params: ApiframeParams = {};
    
    console.log(`[ApiframeImageGenerator] Generating image with model: ${selectedModel}, prompt: ${prompt}`);
    
    try {
      // Cast the result to MediaGenerationResult to ensure TypeScript knows about the error property
      const result = await generateImage(prompt, selectedModel, params) as MediaGenerationResult;
      console.log('[ApiframeImageGenerator] Generation result:', result);
      
      if (result && result.success && result.mediaUrl) {
        setGeneratedImage(result.mediaUrl);
        
        if (onImageGenerated) {
          onImageGenerated(result.mediaUrl);
        }
      } else {
        console.error('[ApiframeImageGenerator] Image generation failed:', result?.error || 'Unknown error');
      }
    } catch (error) {
      console.error('[ApiframeImageGenerator] Error generating image:', error);
    }
  };

  if (!isApiKeyConfigured()) {
    return <ApiframeConfig onConfigChange={() => window.location.reload()} />;
  }

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ImageIcon className="h-5 w-5" />
          <span>APIframe AI Image Generator</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="imageModel">Model</Label>
          <Select 
            value={selectedModel}
            onValueChange={(value) => setSelectedModel(value)}
            disabled={isGenerating}
          >
            <SelectTrigger id="imageModel">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {IMAGE_MODELS.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="imagePrompt">Prompt</Label>
          <Textarea
            id="imagePrompt"
            placeholder="Describe the image you want to generate..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            disabled={isGenerating}
            className="resize-none"
          />
        </div>
        
        {isGenerating && currentTask && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Generating Image...</Label>
              <span className="text-xs text-muted-foreground">
                {currentTask.progress}%
              </span>
            </div>
            <Progress value={currentTask.progress} />
          </div>
        )}
        
        {generatedImage && !isGenerating && (
          <div className="mt-4">
            <div className="border rounded-md overflow-hidden">
              <img 
                src={generatedImage} 
                alt="Generated" 
                className="w-full h-auto object-contain" 
              />
            </div>
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
              Generating...
            </>
          ) : (
            'Generate Image'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiframeImageGenerator;
