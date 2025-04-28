
import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Settings2 } from 'lucide-react';
import { ChatMode } from '@/components/ModeSelector';

// For desktop view
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// For mobile view
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";

// Parameter components
import ImageParameters from './ImageParameters';
import AudioParameters from './AudioParameters';
import VideoParameters from './VideoParameters';

// Types
import { 
  GenerationParameters, 
  ImageParameters as ImageParamsType,
  VideoParameters as VideoParamsType,
  AudioParameters as AudioParamsType,
  getDefaultParameters
} from '@/types/parameters';

interface ParametersManagerProps {
  mode: ChatMode;
  model: string;
  onParamsChange: (params: GenerationParameters) => void;
  initialParams?: Partial<GenerationParameters>;
  variant?: 'button' | 'icon';
  className?: string;
}

const ParametersManager: React.FC<ParametersManagerProps> = ({
  mode,
  model,
  onParamsChange,
  initialParams,
  variant = 'button',
  className
}) => {
  const isMobile = useIsMobile();
  const [params, setParams] = useState<GenerationParameters>(
    getDefaultParameters(mode, model)
  );
  
  // Update params when mode or model changes
  useEffect(() => {
    setParams(prev => ({
      ...getDefaultParameters(mode, model),
      ...initialParams
    }));
  }, [mode, model, initialParams]);
  
  // Don't render anything in text mode
  if (mode === 'text') return null;

  const handleParamsChange = (newParams: GenerationParameters) => {
    setParams(newParams);
    onParamsChange(newParams);
  };

  const getParameterComponent = () => {
    switch (mode) {
      case 'image':
        return (
          <ImageParameters 
            model={model} 
            onParamsChange={handleParamsChange as (params: ImageParamsType) => void}
            initialParams={params as ImageParamsType}
          />
        );
      case 'audio':
        return (
          <AudioParameters 
            model={model} 
            onParamsChange={handleParamsChange as (params: AudioParamsType) => void}
            initialParams={params as AudioParamsType}
          />
        );
      case 'video':
        return (
          <VideoParameters 
            model={model} 
            onParamsChange={handleParamsChange as (params: VideoParamsType) => void}
            initialParams={params as VideoParamsType}
          />
        );
      default:
        return null;
    }
  };
  
  // Render the trigger button based on variant prop
  const renderTrigger = () => {
    if (variant === 'icon') {
      return (
        <Button 
          size="icon" 
          variant="ghost" 
          className="rounded-full w-10 h-10 bg-white/5 hover:bg-white/10"
        >
          <Settings2 className="h-5 w-5" />
        </Button>
      );
    }
    
    return (
      <Button 
        variant="outline" 
        size="sm"
        className="w-full flex items-center gap-2 bg-inventu-card border-inventu-gray/30 text-white hover:bg-inventu-darker"
      >
        <Settings2 className="h-4 w-4" />
        <span>Parâmetros de Geração</span>
      </Button>
    );
  };

  // On mobile devices, always use the Sheet component
  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          {renderTrigger()}
        </SheetTrigger>
        <SheetContent 
          side="bottom" 
          className="h-[80vh] bg-inventu-darker border-t border-white/10 rounded-t-3xl px-4"
        >
          <div className="py-4 space-y-6">
            <div className="flex justify-center">
              <div className="w-12 h-1 rounded-full bg-white/10" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              Parâmetros de Geração
            </h3>
            {getParameterComponent()}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // On desktop, use Popover
  return (
    <div className={className}>
      <Popover>
        <PopoverTrigger asChild>
          {renderTrigger()}
        </PopoverTrigger>
        <PopoverContent className="w-80 bg-inventu-card border-inventu-gray/30 text-white p-4">
          {getParameterComponent()}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ParametersManager;
