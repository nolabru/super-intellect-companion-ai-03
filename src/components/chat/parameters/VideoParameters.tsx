
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { VideoParameters as VideoParamsType } from '@/types/parameters';
import { Type, ImageIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// Video model definitions for the new implementation
const VIDEO_MODELS = [
  { 
    id: 'kling-text', 
    name: 'Kling Text-to-Video',
    requiresReference: false
  },
  { 
    id: 'kling-image', 
    name: 'Kling Image-to-Video',
    requiresReference: true
  },
  { 
    id: 'hunyuan-standard', 
    name: 'Hunyuan Standard',
    requiresReference: false
  },
  { 
    id: 'hunyuan-fast', 
    name: 'Hunyuan Fast',
    requiresReference: false
  },
  { 
    id: 'hailuo-text', 
    name: 'Hailuo Text-to-Video',
    requiresReference: false
  },
  { 
    id: 'hailuo-image', 
    name: 'Hailuo Image-to-Video',
    requiresReference: true
  }
];

interface VideoParametersProps {
  model: string;
  onParamsChange: (params: VideoParamsType) => void;
  initialParams?: Partial<VideoParamsType>;
}

const VideoParameters: React.FC<VideoParametersProps> = ({
  model,
  onParamsChange,
  initialParams
}) => {
  const [params, setParams] = useState<VideoParamsType>({
    model: model || 'kling-text',
    videoType: initialParams?.videoType || 'text-to-video',
    duration: initialParams?.duration || 3,
    resolution: initialParams?.resolution || '720p'
  });

  // Update params when model prop changes
  useEffect(() => {
    if (model && model !== params.model) {
      setParams(prev => ({ ...prev, model }));
    }
  }, [model, params.model]);

  // Update params if initialParams changes
  useEffect(() => {
    if (initialParams) {
      setParams(prev => ({ ...prev, ...initialParams }));
    }
  }, [initialParams]);

  const handleParamChange = <K extends keyof VideoParamsType>(key: K, value: VideoParamsType[K]) => {
    const newParams = { ...params, [key]: value };
    setParams(newParams);
    onParamsChange(newParams);
  };

  return (
    <div className="space-y-4">
      <Alert variant="destructive" className="bg-yellow-500/20 text-yellow-600 border-yellow-600/40">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Video generation is being reconfigured and will be available soon.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label>Modelo</Label>
        <Select
          value={params.model}
          onValueChange={(value) => handleParamChange('model', value)}
        >
          <SelectTrigger className="w-full bg-inventu-darker border-inventu-gray/30">
            <SelectValue placeholder="Selecione um modelo" />
          </SelectTrigger>
          <SelectContent className="bg-inventu-darker border-inventu-gray/30 text-white">
            {VIDEO_MODELS.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Tipo de Geração</Label>
        <RadioGroup 
          value={params.videoType}
          onValueChange={(value) => handleParamChange('videoType', value as 'text-to-video' | 'image-to-video')}
          className="flex flex-col space-y-1"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="text-to-video" id="text-to-video" />
            <Label htmlFor="text-to-video" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              <span>Texto para Vídeo</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="image-to-video" id="image-to-video" />
            <Label htmlFor="image-to-video" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              <span>Imagem para Vídeo</span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>Duração</Label>
        <Select
          value={params.duration?.toString()}
          onValueChange={(value) => handleParamChange('duration', parseInt(value, 10))}
        >
          <SelectTrigger className="w-full bg-inventu-darker border-inventu-gray/30">
            <SelectValue placeholder="Selecione a duração" />
          </SelectTrigger>
          <SelectContent className="bg-inventu-darker border-inventu-gray/30 text-white">
            <SelectItem value="3">3 segundos</SelectItem>
            <SelectItem value="5">5 segundos</SelectItem>
            <SelectItem value="8">8 segundos</SelectItem>
            <SelectItem value="10">10 segundos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Resolução</Label>
        <Select
          value={params.resolution}
          onValueChange={(value) => handleParamChange('resolution', value as '540p' | '720p' | '1080p' | '4k')}
        >
          <SelectTrigger className="w-full bg-inventu-darker border-inventu-gray/30">
            <SelectValue placeholder="Selecione a resolução" />
          </SelectTrigger>
          <SelectContent className="bg-inventu-darker border-inventu-gray/30 text-white">
            <SelectItem value="540p">540p</SelectItem>
            <SelectItem value="720p">720p</SelectItem>
            <SelectItem value="1080p">1080p</SelectItem>
            <SelectItem value="4k">4K</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default VideoParameters;
