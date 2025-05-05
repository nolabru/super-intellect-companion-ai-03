
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ImageIcon, Coins, RefreshCw } from 'lucide-react';
import { useUnifiedMediaGeneration } from '@/hooks/useUnifiedMediaGeneration';
import { saveToGallery } from '@/services/mediaService';
import { tokenService } from '@/services/tokenService';
import { tokenEvents } from '@/components/TokenDisplay';
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
  const [lastTokenUpdate, setLastTokenUpdate] = useState(0);

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
      // Force token info refresh after generation completes
      if (user) {
        console.log('Media generation completed, refreshing tokens');
        tokenService.clearBalanceCache();
        tokenEvents.triggerRefresh();
        loadTokenInfo();
      }
    }
  });

  const handleModelChange = (newModel: string) => {
    setModel(newModel);
    onModelChange(newModel);
  };

  // Load token information 
  const loadTokenInfo = async () => {
    if (user) {
      try {
        console.log('UnifiedMediaGenerator: Loading token info');
        tokenService.clearBalanceCache(); // Force fresh data
        const info = await tokenService.getUserTokenBalance(user.id);
        setTokenInfo(info);
        setLastTokenUpdate(Date.now());
        console.log('UnifiedMediaGenerator: Token info updated', info);
      } catch (error) {
        console.error("Error loading token information:", error);
      }
    }
  };

  // Load token information when component mounts or user changes
  useEffect(() => {
    loadTokenInfo();
    
    // Subscribe to token update events
    const unsubscribe = tokenEvents.subscribe(() => {
      console.log("TokenDisplay event received in UnifiedMediaGenerator");
      loadTokenInfo();
    });
    
    // Also set up a periodic refresh
    const intervalId = setInterval(() => {
      loadTokenInfo();
    }, 5000);
    
    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, [user]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error(`Please enter a ${mediaType} description`);
      return;
    }

    // Display token requirement before generation
    if (user) {
      try {
        // Clear token cache to ensure fresh data
        tokenService.clearBalanceCache();
        
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
          description: `This will use ${tokenCheckResult.required} tokens`
        });
      } catch (error) {
        console.error("Error checking tokens:", error);
      }
    }

    setGeneratedMedia(null);

    // Track token info before generation
    const preGenTokenInfo = tokenInfo;
    
    generateMedia(
      mediaType,
      prompt,
      model,
      additionalParams
    );
    
    // Schedule a token refresh
    setTimeout(() => {
      console.log('Scheduled token refresh after generation request');
      tokenService.clearBalanceCache();
      loadTokenInfo();
    }, 2000);
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

  // Force refresh of token info
  const handleRefreshTokens = () => {
    console.log('Manual token refresh requested');
    tokenService.clearBalanceCache();
    loadTokenInfo();
    tokenEvents.triggerRefresh();
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
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-1 h-5 w-5" 
                onClick={handleRefreshTokens}
                title="Refresh token count"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
              <span className="ml-2 text-xs text-muted-foreground">
                Updated: {new Date(lastTokenUpdate).toLocaleTimeString()}
              </span>
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
