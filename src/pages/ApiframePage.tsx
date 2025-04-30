
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image as ImageIcon, Video, AudioLines } from 'lucide-react';
import ImageGenerator from '@/components/media/ImageGenerator';
import VideoGenerator from '@/components/media/VideoGenerator';
import AudioGenerator from '@/components/media/AudioGenerator';

const ApiframePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('image');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">APIframe.ai Media Generation</h1>
      
      <div className="mb-6">
        <p className="text-muted-foreground">
          Generate high-quality images, videos, and audio using multiple AI models through APIframe.ai.
          The API key is globally configured and ready to use.
        </p>
      </div>
      
      <div className="mt-6">
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
    </div>
  );
};

export default ApiframePage;
