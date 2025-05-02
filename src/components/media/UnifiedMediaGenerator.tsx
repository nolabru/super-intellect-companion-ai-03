
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import MediaModelSelector from './MediaModelSelector';
import MediaProgress from './MediaProgress';
import MediaPreview from './MediaPreview';

interface MediaGeneratorProps {
  mediaType: 'image' | 'video' | 'audio';
  title: string;
  models: Array<{ id: string; name: string; requiresReference?: boolean }>;
  defaultModel: string;
  onMediaGenerated?: (mediaUrl: string) => void;
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
  paramControls,
  referenceUploader,
  additionalParams = {}
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [referenceUrl, setReferenceUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleGenerate = async () => {
    if (!prompt.trim() && !referenceUrl) return;

    const selectedModelData = models.find(m => m.id === selectedModel);
    const modelRequiresReference = selectedModelData?.requiresReference;
    
    if (modelRequiresReference && !referenceUrl) {
      return;
    }
    
    setIsGenerating(true);
    setProgress(10);
    
    // Simulate generation process
    setTimeout(() => {
      setProgress(100);
      setIsGenerating(false);
      toast.info('Esta funcionalidade foi desativada nesta versão');
    }, 2000);
  };

  const handleReferenceUpdate = (url: string | null) => {
    setReferenceUrl(url);
  };

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
          onModelChange={setSelectedModel}
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
            onCancel={() => setIsGenerating(false)}
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
