
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
import { Type, ImageIcon, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

// Only allowed durations per API documentation
const ALLOWED_DURATIONS = [5, 10];

// Only allowed aspect ratios per API documentation
const ALLOWED_ASPECT_RATIOS = [
  { value: "16:9", label: "16:9 (Horizontal)" },
  { value: "9:16", label: "9:16 (Vertical)" },
  { value: "1:1", label: "1:1 (Quadrado)" },
  { value: "4:3", label: "4:3 (Clássico)" },
  { value: "3:4", label: "3:4 (Retrato)" },
  { value: "21:9", label: "21:9 (Ultrawide)" }
];

// Only allowed Kling models per API documentation
const ALLOWED_KLING_MODELS = [
  { value: "kling-v1", label: "Kling v1 (Padrão)" },
  { value: "kling-v1-5", label: "Kling v1.5 (Melhorado)" },
  { value: "kling-v1-6", label: "Kling v1.6 (Avançado)" }
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
    duration: initialParams?.duration || 5, // Default to 5 seconds (valid value)
    resolution: initialParams?.resolution || '720p'
  });

  const [showRequirementsAlert, setShowRequirementsAlert] = useState(false);

  // Update params when model prop changes
  useEffect(() => {
    if (model && model !== params.model) {
      setParams(prev => ({ ...prev, model }));
    }
  }, [model, params.model]);

  // Update params if initialParams changes
  useEffect(() => {
    if (initialParams) {
      // Ensure duration is a valid value
      const safeDuration = initialParams.duration && ALLOWED_DURATIONS.includes(initialParams.duration) 
        ? initialParams.duration
        : 5;
      
      setParams(prev => ({ 
        ...prev, 
        ...initialParams,
        duration: safeDuration
      }));
    }
  }, [initialParams]);

  const handleParamChange = <K extends keyof VideoParamsType>(key: K, value: VideoParamsType[K]) => {
    // Special case for duration to ensure it's one of the allowed values
    if (key === 'duration' && typeof value === 'number' && !ALLOWED_DURATIONS.includes(value)) {
      setShowRequirementsAlert(true);
      value = 5 as any; // Default to 5 seconds if invalid
    }
    
    const newParams = { ...params, [key]: value };
    setParams(newParams);
    onParamsChange(newParams);
  };

  return (
    <div className="space-y-4">
      {showRequirementsAlert && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            Apenas durações de 5 ou 10 segundos são permitidas pela API Kling.
          </AlertDescription>
        </Alert>
      )}
      
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
        <Label>Duração (segundos)</Label>
        <Select
          value={params.duration?.toString()}
          onValueChange={(value) => handleParamChange('duration', parseInt(value, 10))}
        >
          <SelectTrigger className="w-full bg-inventu-darker border-inventu-gray/30">
            <SelectValue placeholder="Selecione a duração" />
          </SelectTrigger>
          <SelectContent className="bg-inventu-darker border-inventu-gray/30 text-white">
            {ALLOWED_DURATIONS.map(duration => (
              <SelectItem key={duration} value={duration.toString()}>
                {duration} segundos
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-400 mt-1">
          Apenas durações de 5 ou 10 segundos são suportadas pela API.
        </p>
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
            {ALLOWED_ASPECT_RATIOS.map(ratio => (
              <SelectItem key={ratio.value} value={ratio.value}>
                {ratio.label}
              </SelectItem>
            ))}
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
        <Label>Modelo Kling</Label>
        <Select
          value={params.klingModel || "kling-v1-5"}
          onValueChange={(value) => handleParamChange('klingModel', value)}
        >
          <SelectTrigger className="w-full bg-inventu-darker border-inventu-gray/30">
            <SelectValue placeholder="Selecione o modelo" />
          </SelectTrigger>
          <SelectContent className="bg-inventu-darker border-inventu-gray/30 text-white">
            {ALLOWED_KLING_MODELS.map(klingModel => (
              <SelectItem key={klingModel.value} value={klingModel.value}>
                {klingModel.label}
              </SelectItem>
            ))}
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
        <p className="text-xs text-gray-400 mt-1">
          O modo 'pro' só funciona com o modelo kling-v1-5.
        </p>
      </div>
    </div>
  );
};

export default VideoParameters;
