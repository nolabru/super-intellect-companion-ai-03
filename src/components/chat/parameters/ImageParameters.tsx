
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageParameters as ImageParamsType } from '@/types/parameters';

const IMAGE_MODELS = [
  { id: 'sdxl', name: 'Stable Diffusion XL' },
  { id: 'kandinsky', name: 'Kandinsky' },
  { id: 'deepfloyd', name: 'DeepFloyd' }
];

const STYLES = [
  { id: 'photographic', name: 'Fotográfico' },
  { id: 'cinematic', name: 'Cinematográfico' },
  { id: 'anime', name: 'Anime' },
  { id: 'digital-art', name: 'Arte Digital' }
];

const ASPECT_RATIOS = [
  { id: '1:1', name: 'Quadrado (1:1)' },
  { id: '16:9', name: 'Paisagem (16:9)' },
  { id: '9:16', name: 'Retrato (9:16)' },
  { id: '4:3', name: 'Clássico (4:3)' }
];

interface ImageParametersProps {
  model: string;
  onParamsChange: (params: ImageParamsType) => void;
  initialParams?: Partial<ImageParamsType>;
}

const ImageParameters: React.FC<ImageParametersProps> = ({ 
  model, 
  onParamsChange, 
  initialParams 
}) => {
  const [params, setParams] = useState<ImageParamsType>({
    model: model || 'sdxl',
    style: initialParams?.style || 'photographic',
    aspectRatio: initialParams?.aspectRatio || '1:1'
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

  const handleParamChange = (key: keyof ImageParamsType, value: string) => {
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
            {IMAGE_MODELS.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Estilo</Label>
        <Select
          value={params.style}
          onValueChange={(value) => handleParamChange('style', value)}
        >
          <SelectTrigger className="w-full bg-inventu-darker border-inventu-gray/30">
            <SelectValue placeholder="Selecione um estilo" />
          </SelectTrigger>
          <SelectContent className="bg-inventu-darker border-inventu-gray/30 text-white">
            {STYLES.map((style) => (
              <SelectItem key={style.id} value={style.id}>
                {style.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Proporção</Label>
        <Select
          value={params.aspectRatio}
          onValueChange={(value) => handleParamChange('aspectRatio', value)}
        >
          <SelectTrigger className="w-full bg-inventu-darker border-inventu-gray/30">
            <SelectValue placeholder="Selecione uma proporção" />
          </SelectTrigger>
          <SelectContent className="bg-inventu-darker border-inventu-gray/30 text-white">
            {ASPECT_RATIOS.map((ratio) => (
              <SelectItem key={ratio.id} value={ratio.id}>
                {ratio.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ImageParameters;
