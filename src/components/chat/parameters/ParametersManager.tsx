
import React from 'react';
import { ChatMode } from '@/components/ModeSelector';
import ImageParameters from './ImageParameters';
import VideoParameters from './VideoParameters';
import AudioParameters from './AudioParameters';
import MusicParameters from './MusicParameters';

interface ParametersManagerProps {
  mode: ChatMode;
  onChange: (params: any) => void;
  params: any;
}

const ParametersManager: React.FC<ParametersManagerProps> = ({ 
  mode, 
  onChange,
  params 
}) => {
  // Use a shared onChange handler for all parameter components
  const handleParamChange = (newParams: any) => {
    onChange(newParams);
  };

  const renderParameters = () => {
    switch (mode) {
      case 'image':
        return (
          <ImageParameters 
            model="ideogram-v2"
            onParamsChange={handleParamChange} 
            initialParams={params} 
          />
        );
      case 'video':
        return (
          <VideoParameters 
            model="luma-ai"
            onParamsChange={handleParamChange} 
            initialParams={params} 
          />
        );
      case 'audio':
        return (
          <AudioParameters 
            onChange={handleParamChange} 
            params={params} 
          />
        );
      case 'music':
        return (
          <MusicParameters 
            onChange={handleParamChange}
            params={params}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-3 bg-inventu-darker border border-inventu-gray/30 rounded-md">
      {renderParameters()}
    </div>
  );
};

export default ParametersManager;
