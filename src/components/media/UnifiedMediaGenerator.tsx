
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ImageIcon, Coins } from 'lucide-react';
import { useUnifiedMediaGeneration } from '@/hooks/useUnifiedMediaGeneration';
import { saveToGallery } from '@/services/mediaService';
import { tokenService } from '@/services/tokenService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UnifiedMediaGeneratorProps {
  mediaType: 'image' | 'video' | 'audio';
  title: string;
  models: { id: string; name: string; tokens?: number }[];
  defaultModel: string;
  onModelChange: (model: string) => void;
  onMediaGenerated?: (mediaUrl: string) => void;
  paramControls?: React.ReactNode;
  additionalParams?: Record<string, any>;
}

const UnifiedMediaGenerator: React.FC<UnifiedMediaGeneratorProps> = ({
  mediaType,
  title,
  models,
  defaultModel,
  onModelChange,
  onMediaGenerated,
  paramControls,
  additionalParams = {}
}) => {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState(defaultModel);
  const [generatedMedia, setGeneratedMedia] = useState<string | null>(null);
  const { user } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<{ tokensRemaining: number } | null>(null);

  const {
    generateMedia,
    isGenerating,
    cancelGeneration
  } = useUnifiedMediaGeneration({
    onComplete: (mediaUrl) => {
      setGeneratedMedia(mediaUrl);
      if (onMediaGenerated) {
        onMediaGenerated(mediaUrl);
      }
    }
  });

  const handleModelChange = (newModel: string) => {
    setModel(newModel);
    onModelChange(newModel);
  };

  // Load token information when component mounts
  React.useEffect(() => {
    const loadTokenInfo = async () => {
      if (user) {
        try {
          const info = await tokenService.getUserTokenBalance(user.id);
          setTokenInfo(info);
        } catch (error) {
          console.error("Error loading token information:", error);
        }
      }
    };
    
    loadTokenInfo();
  }, [user]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error(`Please enter a ${mediaType} description`);
      return;
    }

    // Display token requirement before generation
    if (user) {
      try {
        const selectedModel = models.find(m => m.id === model);
        const tokenCost = selectedModel?.tokens || 0;
        
        const tokenCheckResult = await tokenService.hasEnoughTokens(user.id, model, mediaType);
        
        if (!tokenCheckResult.hasEnough) {
          toast.error(`Not enough tokens`, {
            description: `You need ${tokenCheckResult.required} tokens, but have ${tokenCheckResult.remaining} remaining.`
          });
          return;
        }
        
        toast.info(`Generating ${mediaType}...`, {
          description: `This will use ${tokenCost} tokens`
        });
      } catch (error) {
        console.error("Error checking tokens:", error);
      }
    }

    setGeneratedMedia(null);

    generateMedia(
      mediaType,
      prompt,
      model,
      additionalParams
    );
  };

  const handleSaveToGallery = async () => {
    if (!generatedMedia || !prompt) return;

    try {
      const success = await saveToGallery(generatedMedia, prompt, mediaType, model, user?.id);
      if (success) {
        toast.success(`${mediaType === 'image' ? 'Image' : mediaType === 'video' ? 'Video' : 'Audio'} saved to gallery`);
      }
    } catch (error) {
      toast.error(`Error saving to gallery: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          Generate {mediaType}s using AI models
          {tokenInfo && (
            <div className="mt-2 flex items-center text-sm text-muted-foreground">
              <Coins className="mr-1 h-4 w-4" />
              <span>Available tokens: {tokenInfo.tokensRemaining}</span>
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder={`Describe the ${mediaType} you want to generate...`}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="h-20 resize-none"
            disabled={isGenerating}
          />
        </div>

        {paramControls}

        {generatedMedia && mediaType === 'image' && (
          <div className="mt-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border">
              <img
                src={generatedMedia}
                alt="Generated image"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        )}

        {generatedMedia && mediaType === 'video' && (
          <div className="mt-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border">
              <video
                src={generatedMedia}
                controls
                className="h-full w-full"
              />
            </div>
          </div>
        )}

        {generatedMedia && mediaType === 'audio' && (
          <div className="mt-4">
            <div className="relative w-full overflow-hidden rounded-lg border border-border p-4">
              <audio
                src={generatedMedia}
                controls
                className="w-full"
              />
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        {isGenerating ? (
          <>
            <Button variant="destructive" onClick={cancelGeneration}>
              Cancel
            </Button>
            <Button disabled className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleGenerate} disabled={!prompt.trim()}>
              Generate {mediaType}
            </Button>
            {generatedMedia && (
              <Button variant="outline" onClick={handleSaveToGallery}>
                Save to Gallery
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default UnifiedMediaGenerator;
