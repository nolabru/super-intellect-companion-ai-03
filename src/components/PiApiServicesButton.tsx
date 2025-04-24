
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Image, Video, Music } from 'lucide-react';
import { useMediaGeneration } from '@/hooks/useMediaGeneration';
import { initializePiapiService } from '@/services/piapiDirectService';
import { toast } from 'sonner';

const PiapiServicesButton = () => {
  const [prompt, setPrompt] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'image' | 'video' | 'audio'>('image');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('piapi_key') || '');
  const [isInitialized, setIsInitialized] = useState(false);
  
  const imageGeneration = useMediaGeneration({
    showToasts: true
  });
  
  const videoGeneration = useMediaGeneration({
    showToasts: true
  });
  
  const audioGeneration = useMediaGeneration({
    showToasts: true
  });
  
  useEffect(() => {
    if (apiKey && !isInitialized) {
      try {
        initializePiapiService(apiKey);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing PIAPI service:', error);
        toast.error('Error initializing PIAPI service');
      }
    }
  }, [apiKey, isInitialized]);
  
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newApiKey = e.target.value;
    setApiKey(newApiKey);
    localStorage.setItem('piapi_key', newApiKey);
    setIsInitialized(false); // Reset initialization state
  };
  
  // Get active generation instance based on current tab
  const getActiveGeneration = () => {
    switch (activeTab) {
      case 'image': return imageGeneration;
      case 'video': return videoGeneration;
      case 'audio': return audioGeneration;
      default: return imageGeneration;
    }
  };
  
  const activeGeneration = getActiveGeneration();
  const currentTask = activeGeneration.currentTask;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey) {
      toast.error('Please enter your PIAPI API key');
      return;
    }
    
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }
    
    try {
      if (!isInitialized) {
        initializePiapiService(apiKey);
        setIsInitialized(true);
      }
      
      console.log(`[PiApiServicesButton] Starting ${activeTab} generation with prompt: ${prompt}`);
      
      switch (activeTab) {
        case 'image':
          await imageGeneration.generateMedia(prompt, 'image', 'flux-schnell');
          break;
        case 'video':
          await videoGeneration.generateMedia(prompt, 'video', 'kling-text');
          break;
        case 'audio':
          await audioGeneration.generateMedia(prompt, 'audio', 'diffrhythm-base');
          break;
      }
    } catch (error) {
      console.error('Error generating media:', error);
      toast.error('Error generating media', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
  
  return (
    <div>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <span>PIAPI Services</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium">PIAPI Media Generation</h2>
            <p className="text-sm text-gray-500">
              Generate images, videos and audio using PIAPI services.
            </p>
            
            <div className="mt-4">
              <Label htmlFor="apiKey">PIAPI API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={handleApiKeyChange}
                placeholder="Enter your PIAPI API key"
                className="mt-1"
              />
            </div>
          </div>
          
          <Tabs 
            defaultValue="image" 
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as any)}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="image" className="flex items-center gap-1">
                <Image className="h-4 w-4" />
                <span>Image</span>
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center gap-1">
                <Video className="h-4 w-4" />
                <span>Video</span>
              </TabsTrigger>
              <TabsTrigger value="audio" className="flex items-center gap-1">
                <Music className="h-4 w-4" />
                <span>Audio</span>
              </TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleSubmit} className="p-4">
              <Textarea 
                placeholder={
                  activeTab === 'image' 
                    ? 'Describe the image you want to generate...' 
                    : activeTab === 'video'
                      ? 'Describe the video you want to generate...'
                      : 'Describe the audio you want to generate...'
                }
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full mb-4"
                rows={3}
              />
              
              {currentTask && currentTask.mediaUrl && currentTask.status === 'completed' && (
                <div className="mb-4">
                  {activeTab === 'image' && (
                    <img 
                      src={currentTask.mediaUrl} 
                      alt="Generated image" 
                      className="w-full h-auto rounded-lg"
                    />
                  )}
                  {activeTab === 'video' && (
                    <video 
                      src={currentTask.mediaUrl} 
                      controls
                      className="w-full h-auto rounded-lg"
                    />
                  )}
                  {activeTab === 'audio' && (
                    <audio 
                      src={currentTask.mediaUrl} 
                      controls
                      className="w-full"
                    />
                  )}
                </div>
              )}
              
              {currentTask && currentTask.error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 text-sm text-red-600">
                  {currentTask.error}
                </div>
              )}
              
              {activeGeneration.isGenerating && (
                <div className="flex flex-col items-center justify-center py-4 gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <p className="text-sm text-gray-500">
                    {activeTab === 'image' 
                      ? 'Generating image...' 
                      : activeTab === 'video'
                        ? 'Generating video...'
                        : 'Generating audio...'}
                    {currentTask && currentTask.progress > 0 && ` ${currentTask.progress.toFixed(0)}%`}
                  </p>
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </Button>
                <Button 
                  type="submit" 
                  disabled={!apiKey || !prompt.trim() || activeGeneration.isGenerating}
                >
                  {activeGeneration.isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      Generating...
                    </>
                  ) : (
                    'Generate'
                  )}
                </Button>
              </div>
            </form>
          </Tabs>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default PiapiServicesButton;
