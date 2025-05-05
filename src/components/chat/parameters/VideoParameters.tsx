
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

// Video model definitions for Kling AI via API Frame
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
    duration: initialParams?.duration || 5,
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
            <SelectItem value="5">5 segundos</SelectItem>
            <SelectItem value="10">10 segundos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Proporção</Label>
        <Select
          value={params.aspectRatio || "16:9"}
          onValueChange={(value) => handleParamChange('aspectRatio', value)}
        >
          <SelectTrigger className="w-full bg-inventu-darker border-inventu-gray/30">
            <SelectValue placeholder="Selecione a proporção" />
          </SelectTrigger>
          <SelectContent className="bg-inventu-darker border-inventu-gray/30 text-white">
            <SelectItem value="16:9">16:9 (Horizontal)</SelectItem>
            <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
            <SelectItem value="1:1">1:1 (Quadrado)</SelectItem>
            <SelectItem value="4:3">4:3 (Clássico)</SelectItem>
            <SelectItem value="3:4">3:4 (Retrato)</SelectItem>
            <SelectItem value="21:9">21:9 (Ultrawide)</SelectItem>
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
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Qualidade (Modelo)</Label>
        <Select
          value={params.klingModel || "kling-v1-5"}
          onValueChange={(value) => handleParamChange('klingModel', value)}
        >
          <SelectTrigger className="w-full bg-inventu-darker border-inventu-gray/30">
            <SelectValue placeholder="Selecione a qualidade" />
          </SelectTrigger>
          <SelectContent className="bg-inventu-darker border-inventu-gray/30 text-white">
            <SelectItem value="kling-v1">Kling v1 (Padrão)</SelectItem>
            <SelectItem value="kling-v1-5">Kling v1.5 (Melhorado)</SelectItem>
            <SelectItem value="kling-v1-6">Kling v1.6 (Avançado)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Modo</Label>
        <Select
          value={params.klingMode || "std"}
          onValueChange={(value) => handleParamChange('klingMode', value)}
        >
          <SelectTrigger className="w-full bg-inventu-darker border-inventu-gray/30">
            <SelectValue placeholder="Selecione o modo" />
          </SelectTrigger>
          <SelectContent className="bg-inventu-darker border-inventu-gray/30 text-white">
            <SelectItem value="std">Padrão</SelectItem>
            <SelectItem value="pro">Profissional (apenas com v1.5)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default VideoParameters;
