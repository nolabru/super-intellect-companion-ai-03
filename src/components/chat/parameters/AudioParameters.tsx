
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

const VOICE_MODELS = [
  { id: 'elevenlabs', name: 'ElevenLabs' },
  { id: 'openai', name: 'OpenAI' },
  { id: 'coqui', name: 'Coqui TTS' }
];

const VOICES = [
  { id: 'alloy', name: 'Alloy', model: 'openai' },
  { id: 'echo', name: 'Echo', model: 'openai' },
  { id: 'fable', name: 'Fable', model: 'openai' },
  { id: 'onyx', name: 'Onyx', model: 'openai' },
  { id: 'nova', name: 'Nova', model: 'openai' },
  { id: 'sarah', name: 'Sarah', model: 'elevenlabs' },
  { id: 'thomas', name: 'Thomas', model: 'elevenlabs' },
  { id: 'nicole', name: 'Nicole', model: 'elevenlabs' }
];

interface AudioParametersProps {
  model: string;
  onParamsChange: (params: any) => void;
}

const AudioParameters: React.FC<AudioParametersProps> = ({ onParamsChange }) => {
  const [params, setParams] = useState({
    model: 'elevenlabs',
    voice: 'sarah',
    speed: 1,
    pitch: 1
  });

  const handleParamChange = (key: string, value: any) => {
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
          <SelectContent className="bg-inventu-darker border-inventu-gray/30">
            {VOICE_MODELS.map((model) => (
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
          <SelectContent className="bg-inventu-darker border-inventu-gray/30">
            {availableVoices.map((voice) => (
              <SelectItem key={voice.id} value={voice.id}>
                {voice.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Velocidade: {params.speed.toFixed(1)}x</Label>
        <Slider
          value={[params.speed]}
          min={0.5}
          max={2.0}
          step={0.1}
          onValueChange={([value]) => handleParamChange('speed', value)}
        />
      </div>
    </div>
  );
};

export default AudioParameters;
