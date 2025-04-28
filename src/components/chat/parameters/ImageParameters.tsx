
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  onParamsChange: (params: any) => void;
}

const ImageParameters: React.FC<ImageParametersProps> = ({ onParamsChange }) => {
  const [params, setParams] = useState({
    model: 'sdxl',
    style: 'photographic',
    aspectRatio: '1:1'
  });

  const handleParamChange = (key: string, value: string) => {
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
          <SelectContent className="bg-inventu-darker border-inventu-gray/30">
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
          <SelectContent className="bg-inventu-darker border-inventu-gray/30">
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
          <SelectContent className="bg-inventu-darker border-inventu-gray/30">
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
