
import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ChatMode } from '@/components/ModeSelector';
import ImageParameters from './ImageParameters';
import AudioParameters from './AudioParameters';
import VideoParameters from './VideoParameters';

interface ParameterControlsProps {
  mode: ChatMode;
  model: string;
  onParamsChange: (params: any) => void;
}

const ParameterControls: React.FC<ParameterControlsProps> = ({
  mode,
  model,
  onParamsChange
}) => {
  const getParameterComponent = () => {
    switch (mode) {
      case 'image':
        return <ImageParameters model={model} onParamsChange={onParamsChange} />;
      case 'audio':
        return <AudioParameters model={model} onParamsChange={onParamsChange} />;
      case 'video':
        return <VideoParameters model={model} onParamsChange={onParamsChange} />;
      default:
        return null;
    }
  };

  if (mode === 'text') return null;

  return (
    <div className="w-full mb-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="w-full flex items-center gap-2 bg-inventu-card border-inventu-gray/30 text-white hover:bg-inventu-darker"
          >
            <Settings2 className="h-4 w-4" />
            <span>Parâmetros de Geração</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 bg-inventu-card border-inventu-gray/30 text-white p-4">
          {getParameterComponent()}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ParameterControls;
