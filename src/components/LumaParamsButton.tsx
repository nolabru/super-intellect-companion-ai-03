
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings2, ChevronUp, ImageIcon, Text, Type } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ChatMode } from './ModeSelector';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Types for Luma AI parameters
export interface LumaParams {
  // Common parameters
  model: string;
  
  // Video specific parameters
  videoType?: 'text-to-video' | 'image-to-video';
  resolution?: '540p' | '720p' | '1080p' | '4k';
  duration?: '3s' | '5s' | '8s' | '10s';
  
  // Image specific parameters
  style?: string;
  aspectRatio?: string;
}

// Default parameters
export const defaultLumaParams: LumaParams = {
  model: 'ray-2',
  videoType: 'text-to-video',
  resolution: '720p',
  duration: '5s',
  style: 'photographic',
  aspectRatio: '16:9'
};

interface LumaParamsButtonProps {
  mode: ChatMode;
  model: string;
  params: LumaParams;
  onParamsChange: (params: LumaParams) => void;
}

const LumaParamsButton: React.FC<LumaParamsButtonProps> = ({ 
  mode, 
  model, 
  params, 
  onParamsChange 
}) => {
  // Check if we should show the button
  const isLumaModel = model.includes('luma');
  
  if (!isLumaModel) {
    return null;
  }
  
  const handleParamChange = (key: keyof LumaParams, value: string) => {
    onParamsChange({
      ...params,
      [key]: value
    });
  };
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1 bg-inventu-card border-inventu-gray/30 text-white hover:bg-inventu-darker"
        >
          <Settings2 className="h-4 w-4" />
          <span>Parâmetros Luma AI</span>
          <ChevronUp className="h-4 w-4 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-inventu-card border-inventu-gray/30 text-white p-4" align="start">
        <div className="space-y-4">
          <h3 className="font-bold text-lg border-b border-inventu-gray/30 pb-2">Configurações do Luma AI</h3>
          
          {mode === 'video' && (
            <>
              <div className="space-y-2">
                <Label>Tipo de Geração</Label>
                <RadioGroup 
                  value={params.videoType} 
                  onValueChange={(value) => handleParamChange('videoType', value)}
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
                <Label>Modelo</Label>
                <Select 
                  value={params.model} 
                  onValueChange={(value) => handleParamChange('model', value)}
                >
                  <SelectTrigger className="w-full bg-inventu-darker border-inventu-gray/30">
                    <SelectValue placeholder="Selecione um modelo" />
                  </SelectTrigger>
                  <SelectContent className="bg-inventu-darker border-inventu-gray/30 text-white">
                    <SelectItem value="ray-2">Ray 2</SelectItem>
                    <SelectItem value="ray-1">Ray 1</SelectItem>
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
                    <SelectValue placeholder="Selecione uma resolução" />
                  </SelectTrigger>
                  <SelectContent className="bg-inventu-darker border-inventu-gray/30 text-white">
                    <SelectItem value="540p">540p</SelectItem>
                    <SelectItem value="720p">720p</SelectItem>
                    <SelectItem value="1080p">1080p</SelectItem>
                    <SelectItem value="4k">4k</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Duração</Label>
                <Select 
                  value={params.duration} 
                  onValueChange={(value) => handleParamChange('duration', value as '3s' | '5s' | '8s' | '10s')}
                >
                  <SelectTrigger className="w-full bg-inventu-darker border-inventu-gray/30">
                    <SelectValue placeholder="Selecione uma duração" />
                  </SelectTrigger>
                  <SelectContent className="bg-inventu-darker border-inventu-gray/30 text-white">
                    <SelectItem value="3s">3 segundos</SelectItem>
                    <SelectItem value="5s">5 segundos</SelectItem>
                    <SelectItem value="8s">8 segundos</SelectItem>
                    <SelectItem value="10s">10 segundos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          
          {mode === 'image' && (
            <>
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
                    <SelectItem value="ray-2">Ray 2</SelectItem>
                    <SelectItem value="ray-1">Ray 1</SelectItem>
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
                    <SelectItem value="photographic">Fotográfico</SelectItem>
                    <SelectItem value="cinematic">Cinematográfico</SelectItem>
                    <SelectItem value="anime">Anime</SelectItem>
                    <SelectItem value="cartoon">Desenho</SelectItem>
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
                    <SelectItem value="16:9">16:9</SelectItem>
                    <SelectItem value="4:3">4:3</SelectItem>
                    <SelectItem value="1:1">1:1</SelectItem>
                    <SelectItem value="9:16">9:16</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default LumaParamsButton;
