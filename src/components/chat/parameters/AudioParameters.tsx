import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { AudioParameters as AudioParamsType } from '@/types/parameters';
import { AVAILABLE_MODELS } from '@/constants';

// Get APIFrame audio models from available models
const AUDIO_MODELS = AVAILABLE_MODELS
  .filter(model => model.provider === 'apiframe' && model.modes.includes('audio'))
  .map(model => ({ id: model.id, name: model.displayName }));

// Keep the voice options for different models
const VOICES = [
  { id: 'alloy', name: 'Alloy', model: 'openai-tts-1' },
  { id: 'echo', name: 'Echo', model: 'openai-tts-1' },
  { id: 'fable', name: 'Fable', model: 'openai-tts-1' },
  { id: 'onyx', name: 'Onyx', model: 'openai-tts-1' },
  { id: 'nova', name: 'Nova', model: 'openai-tts-1' },
  { id: 'sarah', name: 'Sarah', model: 'elevenlabs-v2' },
  { id: 'thomas', name: 'Thomas', model: 'elevenlabs-v2' },
  { id: 'nicole', name: 'Nicole', model: 'elevenlabs-v2' }
];

interface AudioParametersProps {
  model: string;
  onParamsChange: (params: AudioParamsType) => void;
  initialParams?: Partial<AudioParamsType>;
}

const AudioParameters: React.FC<AudioParametersProps> = ({ 
  model, 
  onParamsChange, 
  initialParams 
}) => {
  const [params, setParams] = useState<AudioParamsType>({
    model: initialParams?.model || 'elevenlabs',
    voice: initialParams?.voice || 'sarah',
    speed: initialParams?.speed || 1,
    pitch: initialParams?.pitch || 1
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

  const handleParamChange = <K extends keyof AudioParamsType>(key: K, value: AudioParamsType[K]) => {
    const newParams = { ...params, [key]: value };
    setParams(newParams);
    onParamsChange(newParams);
  };

  const availableVoices = VOICES.filter(voice => voice.model === params.model);

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
            {AUDIO_MODELS.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Voz</Label>
        <Select
          value={params.voice}
          onValueChange={(value) => handleParamChange('voice', value)}
        >
          <SelectTrigger className="w-full bg-inventu-darker border-inventu-gray/30">
            <SelectValue placeholder="Selecione uma voz" />
          </SelectTrigger>
          <SelectContent className="bg-inventu-darker border-inventu-gray/30 text-white">
            {availableVoices.map((voice) => (
              <SelectItem key={voice.id} value={voice.id}>
                {voice.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Velocidade: {params.speed?.toFixed(1)}x</Label>
        <Slider
          value={[params.speed || 1]}
          min={0.5}
          max={2.0}
          step={0.1}
          onValueChange={([value]) => handleParamChange('speed', value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Tom: {params.pitch?.toFixed(1)}</Label>
        <Slider
          value={[params.pitch || 1]}
          min={0.5}
          max={1.5}
          step={0.1}
          onValueChange={([value]) => handleParamChange('pitch', value)}
        />
      </div>
    </div>
  );
};

export default AudioParameters;
