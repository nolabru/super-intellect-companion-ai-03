
import React, { useState, useEffect } from 'react';
import ApiframeServices from '@/components/apiframe/ApiframeServices';
import { apiframeService } from '@/services/apiframeService';
import { Button } from '@/components/ui/button';
import { Wand2, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ApiframePage: React.FC = () => {
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if APIframe is configured on mount
    setIsConfigured(apiframeService.isApiKeyConfigured());
  }, []);

  const handleConfigClick = () => {
    navigate('/services-config');
  };

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
          <ApiframeServices />
        </div>
      )}
    </div>
  );
};

export default ApiframePage;
