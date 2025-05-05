
import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import MidjourneyParameters from './MidjourneyParameters';
import { MidjourneyParams } from './MidjourneyParameters';

export interface ImageParams {
  style_type?: string;
  aspect_ratio?: string;
  [key: string]: any;
}

interface ImageParametersProps {
  model: string;
  onParamsChange: (params: ImageParams) => void;
  initialParams?: ImageParams;
}

const IdeogramParameters: React.FC<{
  onParamsChange: (params: ImageParams) => void;
  initialParams?: ImageParams;
}> = ({ onParamsChange, initialParams = {} }) => {
  const [params, setParams] = React.useState<ImageParams>({
    style_type: initialParams.style_type || 'GENERAL',
    aspect_ratio: initialParams.aspect_ratio || 'ASPECT_1_1'
  });

  const handleParamChange = (key: string, value: string) => {
    const newParams = { ...params, [key]: value };
    setParams(newParams);
    onParamsChange(newParams);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm text-white/70">Estilo</Label>
          <Select
            value={params.style_type}
            onValueChange={(value) => handleParamChange('style_type', value)}
          >
            <SelectTrigger className="bg-inventu-darker border-inventu-gray/30">
              <SelectValue placeholder="Estilo" />
            </SelectTrigger>
            <SelectContent className="bg-inventu-dark border-inventu-gray/30">
              <SelectItem value="GENERAL">Geral</SelectItem>
              <SelectItem value="PAINTING">Pintura</SelectItem>
              <SelectItem value="PHOTO">Foto</SelectItem>
              <SelectItem value="ANIME">Anime</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-white/70">Proporção</Label>
          <Select
            value={params.aspect_ratio}
            onValueChange={(value) => handleParamChange('aspect_ratio', value)}
          >
            <SelectTrigger className="bg-inventu-darker border-inventu-gray/30">
              <SelectValue placeholder="Proporção" />
            </SelectTrigger>
            <SelectContent className="bg-inventu-dark border-inventu-gray/30">
              <SelectItem value="ASPECT_1_1">Quadrado (1:1)</SelectItem>
              <SelectItem value="ASPECT_4_3">Paisagem (4:3)</SelectItem>
              <SelectItem value="ASPECT_3_4">Retrato (3:4)</SelectItem>
              <SelectItem value="ASPECT_16_9">Widescreen (16:9)</SelectItem>
              <SelectItem value="ASPECT_9_16">Vertical (9:16)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

const convertToMidjourneyFormat = (params: ImageParams): Partial<MidjourneyParams> => {
  // Convert aspect_ratio if it exists
  let aspectRatio: "1:1" | "4:3" | "3:4" | "16:9" | "9:16" = "1:1"; 
  
  if (params.aspect_ratio) {
    if (params.aspect_ratio === 'ASPECT_1_1') aspectRatio = "1:1";
    else if (params.aspect_ratio === 'ASPECT_4_3') aspectRatio = "4:3";
    else if (params.aspect_ratio === 'ASPECT_3_4') aspectRatio = "3:4";
    else if (params.aspect_ratio === 'ASPECT_16_9') aspectRatio = "16:9";
    else if (params.aspect_ratio === 'ASPECT_9_16') aspectRatio = "9:16";
  }
  
  return {
    ...params,
    aspect_ratio: aspectRatio,
    quality: params.quality as 'standard' | 'hd' || 'standard',
    style: params.style as any || 'raw',
  };
};

const ImageParameters: React.FC<ImageParametersProps> = ({ 
  model, 
  onParamsChange, 
  initialParams = {} 
}) => {
  // Return the appropriate parameters component based on the model
  if (model === 'midjourney') {
    return (
      <MidjourneyParameters 
        onParamsChange={onParamsChange} 
        initialParams={convertToMidjourneyFormat(initialParams)}
      />
    );
  }
  
  // Default to Ideogram parameters for any other model
  return (
    <IdeogramParameters 
      onParamsChange={onParamsChange} 
      initialParams={initialParams}
    />
  );
};

export default ImageParameters;
