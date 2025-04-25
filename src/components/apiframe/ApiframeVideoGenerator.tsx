import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Film, Loader2, Upload } from 'lucide-react';
import { useVideoGeneration } from '@/hooks/apiframe/useVideoGeneration';
import { ApiframeVideoParams } from '@/types/apiframeGeneration';
import ApiframeConfig from './ApiframeConfig';
import MediaProgress from './common/MediaProgress';
import VideoModelSelector, { VideoModelType, VIDEO_MODELS } from './video/VideoModelSelector';
import VideoDurationSelector from './video/VideoDurationSelector';
import VideoPreview from './video/VideoPreview';
import { Input } from '@/components/ui/input';

interface ApiframeVideoGeneratorProps {
  onVideoGenerated?: (videoUrl: string) => void;
}

const ApiframeVideoGenerator: React.FC<ApiframeVideoGeneratorProps> = ({ onVideoGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<VideoModelType>('kling-text');
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState('10');
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState(false);
  
  const { generateVideo, isGenerating, isApiKeyConfigured, currentTask } = useVideoGeneration();

  const handleModelChange = (modelId: VideoModelType) => {
    setSelectedModel(modelId);
    setGeneratedVideo(null);
    
    const selectedModelData = VIDEO_MODELS.find(m => m.id === modelId);
    if (!selectedModelData?.requiresImage) {
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

  const handleMediaLoaded = () => {
    setIsMediaLoading(false);
    console.log('Video loaded successfully:', generatedVideo);
  };

  const handleMediaError = () => {
    setMediaError(true);
    setIsMediaLoading(false);
  };

  const retryMediaLoad = () => {
    setMediaError(false);
    setIsMediaLoading(true);
  };
  
  const openMediaInNewTab = () => {
    if (generatedVideo) {
      window.open(generatedVideo, '_blank');
    }
  };
  
  const handleGenerate = async () => {
    if (!prompt.trim() && !referenceImageUrl) {
      return;
    }
    
    const selectedModelData = VIDEO_MODELS.find(m => m.id === selectedModel);
    const modelRequiresImage = selectedModelData?.requiresImage;
    
    if (modelRequiresImage && !referenceImageUrl) {
      return;
    }

    const params: ApiframeVideoParams = {
      duration: parseInt(duration, 10),
      aspectRatio: "16:9"
    };
    
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
        <VideoModelSelector
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
          disabled={isGenerating}
        />
        
        <VideoDurationSelector
          duration={duration}
          onDurationChange={setDuration}
          disabled={isGenerating}
        />
        
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
          <MediaProgress
            progress={currentTask.progress}
            type="video"
          />
        )}
        
        {generatedVideo && !isGenerating && (
          <VideoPreview
            videoUrl={generatedVideo}
            isLoading={isMediaLoading}
            mediaError={mediaError}
            onRetry={retryMediaLoad}
            onOpenInNewTab={openMediaInNewTab}
          />
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
