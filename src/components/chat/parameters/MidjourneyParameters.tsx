
import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

export interface MidjourneyParams {
  negative_prompt?: string;
  quality: 'standard' | 'hd';
  aspect_ratio: '1:1' | '4:3' | '3:4' | '16:9' | '9:16';
  style: 'raw' | 'cute' | 'anime' | 'photography' | 'digital-art' | 'comic-book' | 'fantasy-art' | 'line-art' | 'analog-film' | 'neon-punk' | 'isometric' | 'low-poly' | 'origami' | 'modeling-compound' | 'cinematic' | 'pixel-art';
}

interface MidjourneyParametersProps {
  onParamsChange: (params: MidjourneyParams) => void;
  initialParams?: Partial<MidjourneyParams>;
}

const defaultParams: MidjourneyParams = {
  negative_prompt: '',
  quality: 'standard',
  aspect_ratio: '1:1',
  style: 'raw'
};

const MidjourneyParameters: React.FC<MidjourneyParametersProps> = ({ 
  onParamsChange, 
  initialParams = {} 
}) => {
  const [params, setParams] = React.useState<MidjourneyParams>({
    ...defaultParams,
    ...initialParams
  });

  const updateParams = (newParams: Partial<MidjourneyParams>) => {
    const updatedParams = { ...params, ...newParams };
    setParams(updatedParams);
    onParamsChange(updatedParams);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm text-white/70 mb-2">Prompt Negativo</Label>
        <Textarea
          placeholder="Elementos a serem evitados na imagem"
          value={params.negative_prompt || ''}
          onChange={(e) => updateParams({ negative_prompt: e.target.value })}
          className="bg-inventu-darker border-inventu-gray/30 resize-none"
        />
      </div>

      <Separator className="bg-inventu-gray/20" />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm text-white/70">Qualidade</Label>
          <Select
            value={params.quality}
            onValueChange={(value: 'standard' | 'hd') => updateParams({ quality: value })}
          >
            <SelectTrigger className="bg-inventu-darker border-inventu-gray/30">
              <SelectValue placeholder="Qualidade" />
            </SelectTrigger>
            <SelectContent className="bg-inventu-dark border-inventu-gray/30">
              <SelectItem value="standard">Padrão</SelectItem>
              <SelectItem value="hd">HD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-white/70">Proporção</Label>
          <Select
            value={params.aspect_ratio}
            onValueChange={(value: '1:1' | '4:3' | '3:4' | '16:9' | '9:16') => updateParams({ aspect_ratio: value })}
          >
            <SelectTrigger className="bg-inventu-darker border-inventu-gray/30">
              <SelectValue placeholder="Proporção" />
            </SelectTrigger>
            <SelectContent className="bg-inventu-dark border-inventu-gray/30">
              <SelectItem value="1:1">Quadrado (1:1)</SelectItem>
              <SelectItem value="4:3">Paisagem (4:3)</SelectItem>
              <SelectItem value="3:4">Retrato (3:4)</SelectItem>
              <SelectItem value="16:9">Widescreen (16:9)</SelectItem>
              <SelectItem value="9:16">Vertical (9:16)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-white/70">Estilo</Label>
        <Select
          value={params.style}
          onValueChange={(value) => updateParams({ style: value as any })}
        >
          <SelectTrigger className="bg-inventu-darker border-inventu-gray/30">
            <SelectValue placeholder="Estilo" />
          </SelectTrigger>
          <SelectContent className="bg-inventu-dark border-inventu-gray/30 max-h-[200px]">
            <SelectItem value="raw">Padrão</SelectItem>
            <SelectItem value="cute">Fofo</SelectItem>
            <SelectItem value="anime">Anime</SelectItem>
            <SelectItem value="photography">Fotografia</SelectItem>
            <SelectItem value="digital-art">Arte Digital</SelectItem>
            <SelectItem value="comic-book">Quadrinhos</SelectItem>
            <SelectItem value="fantasy-art">Arte Fantasia</SelectItem>
            <SelectItem value="line-art">Arte Linhas</SelectItem>
            <SelectItem value="analog-film">Filme Analógico</SelectItem>
            <SelectItem value="neon-punk">Neon Punk</SelectItem>
            <SelectItem value="isometric">Isométrico</SelectItem>
            <SelectItem value="low-poly">Low Poly</SelectItem>
            <SelectItem value="origami">Origami</SelectItem>
            <SelectItem value="modeling-compound">Modelagem</SelectItem>
            <SelectItem value="cinematic">Cinematográfico</SelectItem>
            <SelectItem value="pixel-art">Pixel Art</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default MidjourneyParameters;
