
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { usePersistedMediaGeneration } from '@/hooks/usePersistedMediaGeneration';
import MediaModelSelector from './MediaModelSelector';
import MediaProgress from './MediaProgress';
import MediaPreview from './MediaPreview';

interface MediaGeneratorProps {
  mediaType: 'image' | 'video' | 'audio';
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

  // Use our persisted media generation hook
  const {
    generateMedia,
    cancelGeneration,
    isGenerating,
    generatedMedia,
    currentTask,
    persistedTask
  } = usePersistedMediaGeneration({
    showToasts: true,
    onComplete: (mediaUrl) => {
      if (onMediaGenerated) {
        onMediaGenerated(mediaUrl);
      }
    }
  });

  // Use the persisted task for display if available
  const activeTask = persistedTask || currentTask;
  const taskProgress = activeTask?.progress || 0;

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
    };

    generateMedia(
      mediaType,
      prompt,
      selectedModel,
      params,
      referenceUrl || undefined
    );
  };

  const handleReferenceUpdate = (url: string | null) => {
    setReferenceUrl(url);
  };

  // Get the media URL from generated media or persisted task
  const mediaUrl = generatedMedia?.url || persistedTask?.mediaUrl;

  // Reset form when media type changes
  useEffect(() => {
    setPrompt('');
    setReferenceUrl(null);
  }, [mediaType]);

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {mediaType === 'image' && <span className="h-5 w-5">🖼️</span>}
          {mediaType === 'video' && <span className="h-5 w-5">🎬</span>}
          {mediaType === 'audio' && <span className="h-5 w-5">🔊</span>}
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
        
        {isGenerating && activeTask && (
          <MediaProgress
            progress={taskProgress}
            type={mediaType}
            onCancel={cancelGeneration}
          />
        )}
        
        {mediaUrl && !isGenerating && (
          <MediaPreview
            mediaUrl={mediaUrl}
            mediaType={mediaType}
          />
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
