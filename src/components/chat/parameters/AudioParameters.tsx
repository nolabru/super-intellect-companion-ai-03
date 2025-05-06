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
  onChange: (params: any) => void;
  params: any;
}

const AudioParameters: React.FC<AudioParametersProps> = ({ 
  onChange, 
  params 
}) => {
  const [localParams, setLocalParams] = useState({
    model: params?.model || 'elevenlabs',
    voice: params?.voice || 'sarah',
    speed: params?.speed || 1,
    pitch: params?.pitch || 1
  });

  // Update params if initialParams changes
  useEffect(() => {
    if (params) {
      setLocalParams(prev => ({ ...prev, ...params }));
    }
  }, [params]);

  const handleParamChange = (key: string, value: any) => {
    const newParams = { ...localParams, [key]: value };
    setLocalParams(newParams);
    onChange(newParams);
  };

  const availableVoices = VOICES.filter(voice => voice.model === localParams.model);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Modelo</Label>
        <Select
          value={localParams.model}
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
          value={localParams.voice}
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
        <Label>Velocidade: {localParams.speed?.toFixed(1)}x</Label>
        <Slider
          value={[localParams.speed || 1]}
          min={0.5}
          max={2.0}
          step={0.1}
          onValueChange={([value]) => handleParamChange('speed', value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Tom: {localParams.pitch?.toFixed(1)}</Label>
        <Slider
          value={[localParams.pitch || 1]}
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
