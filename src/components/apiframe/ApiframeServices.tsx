
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Film, AudioLines, Settings, History } from 'lucide-react';
import ImageGenerator from '../media/ImageGenerator';
import VideoGenerator from '../media/VideoGenerator';
import AudioGenerator from '../media/AudioGenerator';
import ApiframeConfig from './ApiframeConfig';
import MediaHistory from '../media/MediaHistory';
import { apiframeService } from '@/services/apiframeService';

interface ApiframeServicesProps {
  defaultTab?: 'image' | 'video' | 'audio' | 'settings' | 'history';
  onMediaGenerated?: (url: string, type: 'image' | 'video' | 'audio') => void;
}

const ApiframeServices: React.FC<ApiframeServicesProps> = ({
  defaultTab = 'image',
  onMediaGenerated
}) => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [isConfigured] = useState<boolean>(apiframeService.isApiKeyConfigured());
  
  const handleMediaGenerated = (mediaType: 'image' | 'video' | 'audio') => (url: string) => {
    if (onMediaGenerated) {
      onMediaGenerated(url, mediaType);
    }
  };

  return (
    <Tabs 
      defaultValue={isConfigured ? activeTab : 'settings'} 
      className="w-full"
      onValueChange={setActiveTab}
    >
      <TabsList className="grid grid-cols-5">
        <TabsTrigger value="image" className="flex items-center gap-2">
          <Image className="h-4 w-4" />
          <span className="hidden sm:inline">Image</span>
        </TabsTrigger>
        <TabsTrigger value="video" className="flex items-center gap-2">
          <Film className="h-4 w-4" />
          <span className="hidden sm:inline">Video</span>
        </TabsTrigger>
        <TabsTrigger value="audio" className="flex items-center gap-2">
          <AudioLines className="h-4 w-4" />
          <span className="hidden sm:inline">Audio</span>
        </TabsTrigger>
        <TabsTrigger value="history" className="flex items-center gap-2">
          <History className="h-4 w-4" />
          <span className="hidden sm:inline">History</span>
        </TabsTrigger>
        <TabsTrigger value="settings" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Settings</span>
        </TabsTrigger>
      </TabsList>
      
      <div className="mt-4">
        <TabsContent value="image">
          <ImageGenerator onImageGenerated={handleMediaGenerated('image')} />
        </TabsContent>
        
        <TabsContent value="video">
          <VideoGenerator onVideoGenerated={handleMediaGenerated('video')} />
        </TabsContent>
        
        <TabsContent value="audio">
          <AudioGenerator onAudioGenerated={handleMediaGenerated('audio')} />
        </TabsContent>
        
        <TabsContent value="history">
          <MediaHistory />
        </TabsContent>
        
        <TabsContent value="settings">
          <ApiframeConfig onConfigChange={() => setActiveTab('image')} />
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default ApiframeServices;
