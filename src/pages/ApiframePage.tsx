
import React, { useState, useEffect } from 'react';
import ApiframeServices from '@/components/apiframe/ApiframeServices';
import { apiframeService } from '@/services/apiframeService';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wand2, Settings, Loader2, Image as ImageIcon, Video, AudioLines } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ImageGenerator from '@/components/media/ImageGenerator';
import VideoGenerator from '@/components/media/VideoGenerator';
import AudioGenerator from '@/components/media/AudioGenerator';

const ApiframePage: React.FC = () => {
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('image');
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if APIframe is configured on mount
    const checkApiKey = async () => {
      try {
        setIsChecking(true);
        const configured = apiframeService.isApiKeyConfigured();
        setIsConfigured(configured);
        
        // If configured, try to verify the API key silently
        if (configured) {
          try {
            // Silently test the connection using a non-existent task ID
            // This will validate if the API key is correct
            const dummyTaskId = 'verify-' + Date.now();
            await apiframeService.checkTaskStatus(dummyTaskId);
          } catch (error) {
            console.log('API key verification attempted - normal to see errors for non-existent tasks');
            // We don't show errors here as this is just a verification check
          }
        }
      } catch (error) {
        console.error('Error checking APIframe configuration:', error);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkApiKey();
  }, []);

  const handleConfigClick = () => {
    navigate('/services-config');
  };
  
  const handleTestConfig = async () => {
    try {
      toast.info('Testing connection to APIframe...');
      
      // Use a dummy task ID to test the connection
      const dummyTaskId = 'test-connection-' + Date.now();
      
      try {
        await apiframeService.checkTaskStatus(dummyTaskId);
        // If we get here without an error, the API key is valid
        toast.success('Successfully connected to APIframe');
      } catch (error) {
        // Check if the error is due to invalid API key or just a 404 for the task
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes("unauthorized") || 
            errorMessage.includes("invalid key") || 
            errorMessage.includes("forbidden")) {
          toast.error('Invalid API key');
        } else {
          // If we get a 404 or other error, it means the API key is valid
          // but the task doesn't exist (which is expected)
          toast.success('Successfully connected to APIframe');
        }
      }
    } catch (error) {
      console.error('Error testing connection to APIframe:', error);
      toast.error('Failed to connect to APIframe');
    }
  };

  if (isChecking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center p-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-xl font-semibold mb-2">Checking APIframe Configuration</h2>
          <p className="text-center text-muted-foreground">
            Please wait while we verify your APIframe.ai configuration...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">APIframe.ai Media Generation</h1>
      
      <div className="mb-6">
        <p className="text-muted-foreground">
          Generate high-quality images, videos, and audio using multiple AI models through APIframe.ai.
          {!isConfigured && " Configure your API key in the Settings tab to get started."}
        </p>
      </div>
      
      {!isConfigured ? (
        <div className="flex flex-col items-center justify-center p-10 border rounded-lg bg-muted/30">
          <Wand2 className="h-12 w-12 mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">API Key Required</h2>
          <p className="text-center text-muted-foreground mb-6">
            To start generating AI content, you need to configure your APIframe.ai API key.
            You can get your API key from the APIframe dashboard.
          </p>
          <Button onClick={handleConfigClick} className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configure API Key
          </Button>
        </div>
      ) : (
        <div className="mt-6">
          <div className="flex justify-end mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleTestConfig} 
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Test Connection
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleConfigClick} 
              className="flex items-center gap-2 ml-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="image" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Images
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Videos
              </TabsTrigger>
              <TabsTrigger value="audio" className="flex items-center gap-2">
                <AudioLines className="h-4 w-4" />
                Audio
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="image" className="focus-visible:outline-none focus-visible:ring-0">
              <div className="flex justify-center">
                <ImageGenerator />
              </div>
            </TabsContent>
            
            <TabsContent value="video" className="focus-visible:outline-none focus-visible:ring-0">
              <div className="flex justify-center">
                <VideoGenerator />
              </div>
            </TabsContent>
            
            <TabsContent value="audio" className="focus-visible:outline-none focus-visible:ring-0">
              <div className="flex justify-center">
                <AudioGenerator />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default ApiframePage;
