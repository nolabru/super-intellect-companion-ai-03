
import React from 'react';
import ApiframeServices from '@/components/apiframe/ApiframeServices';

const ApiframePage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">APIframe.ai Media Generation</h1>
      
      <div className="mb-6">
        <p className="text-muted-foreground">
          Generate high-quality images, videos, and audio using multiple AI models through APIframe.ai.
          Configure your API key in the Settings tab to get started.
        </p>
      </div>
      
      <div className="mt-8">
        <ApiframeServices />
      </div>
    </div>
  );
};

export default ApiframePage;
