
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useIdeogramGeneration } from '@/hooks/useIdeogramGeneration';
import MediaModelSelector from './MediaModelSelector';
import MediaProgress from './MediaProgress';
import MediaPreview from './MediaPreview';

interface MediaGeneratorProps {
  mediaType: 'image' | 'audio' | 'video';
  title: string;
  models: Array<{ id: string; name: string; requiresReference?: boolean }>;
  defaultModel: string;
  onMediaGenerated?: (mediaUrl: string) => void;
  onModelChange?: (modelId: string) => void;
  paramControls?: React.ReactNode;
  referenceUploader?: React.ReactNode;
  additionalParams?: Record<string, any>;
}

const UnifiedMediaGenerator: React.FC<MediaGeneratorProps> = ({
  mediaType,
  title,
  models,
  defaultModel,
  onMediaGenerated,
  onModelChange,
  paramControls,
  referenceUploader,
  additionalParams = {}
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [referenceUrl, setReferenceUrl] = useState<string | null>(null);

  // Use our ideogram generation hook for images
  // In the future, we can extend this to use other hooks based on mediaType
  const {
    generateImage,
    isGenerating,
    progress,
    generatedImageUrl,
    error
  } = useIdeogramGeneration({
    showToasts: true,
    onComplete: (mediaUrl) => {
      if (onMediaGenerated) {
        onMediaGenerated(mediaUrl);
      }
    }
  });

  const [generatedMediaUrl, setGeneratedMediaUrl] = useState<string | null>(null);
  
  // Determine which URL to use for display (specific to media type)
  const displayUrl = mediaType === 'image' ? generatedImageUrl : generatedMediaUrl;

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    // Propagate model change to parent
    if (onModelChange) {
      onModelChange(modelId);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !referenceUrl) return;

    const selectedModelData = models.find(m => m.id === selectedModel);
    const modelRequiresReference = selectedModelData?.requiresReference;
    
    if (modelRequiresReference && !referenceUrl) {
      return;
    }
    
    // Combine the additionalParams with model-specific parameters
    const params = {
      ...additionalParams,
      modelId: selectedModel,
      referenceUrl: referenceUrl || undefined
    };

    // Different generation based on media type
    if (mediaType === 'image') {
      await generateImage(prompt, params);
    } else {
      // For now, audio and video generation are placeholders
      // We'll implement proper generation in the future
      console.log(`Generating ${mediaType} with prompt: ${prompt} and model: ${selectedModel}`);
      console.log('Additional params:', params);
      
      // Simulate generation for now with a timer
      setTimeout(() => {
        setGeneratedMediaUrl('https://example.com/placeholder-media-url');
        if (onMediaGenerated) {
          onMediaGenerated('https://example.com/placeholder-media-url');
        }
      }, 2000);
    }
  };

  const handleReferenceUpdate = (url: string | null) => {
    setReferenceUrl(url);
  };

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span className="h-5 w-5">🖼️</span>
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <MediaModelSelector
          models={models}
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
          disabled={isGenerating}
        />
        
        {paramControls && (
          <div className="space-y-2">
            {paramControls}
          </div>
        )}
        
        {referenceUploader && (
          <div className="space-y-2">
            {React.cloneElement(referenceUploader as React.ReactElement, {
              onReferenceUpdate: handleReferenceUpdate,
              disabled: isGenerating
            })}
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="mediaPrompt">Prompt</Label>
          <Textarea
            id="mediaPrompt"
            placeholder={`Describe the ${mediaType} you want to generate...`}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            disabled={isGenerating}
            className="resize-none"
          />
        </div>
        
        {isGenerating && (
          <MediaProgress
            progress={progress}
            type={mediaType}
            onCancel={() => alert(`Cancellation not supported for ${mediaType} generation`)}
          />
        )}
        
        {displayUrl && !isGenerating && (
          <MediaPreview
            mediaUrl={displayUrl}
            mediaType={mediaType}
          />
        )}
        
        {error && !isGenerating && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button
          onClick={handleGenerate}
          disabled={
            ((!prompt.trim() && !referenceUrl) || 
            (models.find(m => m.id === selectedModel)?.requiresReference && !referenceUrl)) || 
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
            `Generate ${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}`
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default UnifiedMediaGenerator;
