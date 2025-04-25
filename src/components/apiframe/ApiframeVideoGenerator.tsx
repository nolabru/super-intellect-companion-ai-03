
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Film, Upload } from 'lucide-react';
import { useVideoGeneration } from '@/hooks/apiframe/useVideoGeneration';
import { ApiframeParams } from '@/types/apiframeGeneration';
import ApiframeConfig from './ApiframeConfig';
import { Progress } from '@/components/ui/progress';

const VIDEO_MODELS = [
  { id: 'kling-text', name: 'Kling (Text to Video)' },
  { id: 'kling-image', name: 'Kling (Image to Video)', requiresImage: true },
  { id: 'hunyuan-fast', name: 'HunYuan Fast' },
  { id: 'hunyuan-standard', name: 'HunYuan Standard' },
  { id: 'hailuo-text', name: 'Hailuo (Text to Video)' },
  { id: 'hailuo-image', name: 'Hailuo (Image to Video)', requiresImage: true }
];

interface ApiframeVideoGeneratorProps {
  onVideoGenerated?: (videoUrl: string) => void;
}

const ApiframeVideoGenerator: React.FC<ApiframeVideoGeneratorProps> = ({ onVideoGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(VIDEO_MODELS[0].id);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState('10');
  
  const { generateVideo, isGenerating, isApiKeyConfigured, currentTask } = useVideoGeneration();
  
  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    setGeneratedVideo(null);
    
    // Reset reference image if switching to a model that doesn't require it
    const modelRequiresImage = VIDEO_MODELS.find(m => m.id === modelId)?.requiresImage;
    if (!modelRequiresImage) {
      setReferenceImage(null);
      setReferenceImageUrl(null);
    }
  };
  
  const handleReferenceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceImage(file);
      const url = URL.createObjectURL(file);
      setReferenceImageUrl(url);
    }
  };
  
  const handleGenerate = async () => {
    if (!prompt.trim() && !referenceImageUrl) {
      return;
    }
    
    const modelRequiresImage = VIDEO_MODELS.find(m => m.id === selectedModel)?.requiresImage;
    
    if (modelRequiresImage && !referenceImageUrl) {
      return;
    }

    const params: ApiframeParams = {
      duration: parseInt(duration, 10),
      aspectRatio: "16:9"
    };
    
    // For now we're just using the URL directly
    // In a real implementation, you would upload the image first
    const result = await generateVideo(prompt, selectedModel, params, referenceImageUrl || undefined);
    
    if (result.success && result.mediaUrl) {
      setGeneratedVideo(result.mediaUrl);
      
      if (onVideoGenerated) {
        onVideoGenerated(result.mediaUrl);
      }
    }
  };

  if (!isApiKeyConfigured()) {
    return <ApiframeConfig onConfigChange={() => window.location.reload()} />;
  }

  const selectedModelData = VIDEO_MODELS.find(m => m.id === selectedModel);
  const requiresImage = selectedModelData?.requiresImage;

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Film className="h-5 w-5" />
          <span>APIframe AI Video Generator</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="videoModel">Model</Label>
          <Select 
            value={selectedModel}
            onValueChange={handleModelChange}
            disabled={isGenerating}
          >
            <SelectTrigger id="videoModel">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {VIDEO_MODELS.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="duration">Duration (seconds)</Label>
          <Input
            id="duration"
            type="number"
            min="1"
            max="60"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            disabled={isGenerating}
          />
        </div>
        
        {requiresImage && (
          <div className="space-y-2">
            <Label htmlFor="referenceImage">Reference Image</Label>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Input
                id="referenceImage"
                type="file"
                accept="image/*"
                onChange={handleReferenceImageChange}
                disabled={isGenerating}
                className="cursor-pointer"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => document.getElementById('referenceImage')?.click()}
                disabled={isGenerating}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            
            {referenceImageUrl && (
              <div className="border rounded-md overflow-hidden mt-2">
                <img 
                  src={referenceImageUrl} 
                  alt="Reference" 
                  className="w-full h-48 object-contain" 
                />
              </div>
            )}
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="videoPrompt">Prompt</Label>
          <Textarea
            id="videoPrompt"
            placeholder="Describe the video you want to generate..."
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
              <Label>Generating Video...</Label>
              <span className="text-xs text-muted-foreground">
                {currentTask.progress}%
              </span>
            </div>
            <Progress value={currentTask.progress} />
          </div>
        )}
        
        {generatedVideo && !isGenerating && (
          <div className="mt-4">
            <div className="border rounded-md overflow-hidden">
              <video 
                src={generatedVideo} 
                controls 
                className="w-full h-auto" 
              />
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button
          onClick={handleGenerate}
          disabled={
            ((!prompt.trim() && !requiresImage) || 
            (requiresImage && !referenceImageUrl)) || 
            isGenerating
          }
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Video'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiframeVideoGenerator;
