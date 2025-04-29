
import React, { useState } from 'react';
import UnifiedMediaGenerator from './UnifiedMediaGenerator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Audio models data
const AUDIO_MODELS = [
  { id: 'elevenlabs-v2', name: 'ElevenLabs v2' },
  { id: 'openai-tts-1', name: 'OpenAI TTS-1' },
  { id: 'coqui-xtts', name: 'Coqui XTTS' }
];

// Voice options for different models
const VOICES = {
  'elevenlabs-v2': [
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah' },
    { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam' },
    { id: 'jsCqWAovK2LkecY7zXl4', name: 'Nicole' },
    { id: 'XB0fDUnXU5powFXDhCwa', name: 'Thomas' }
  ],
  'openai-tts-1': [
    { id: 'alloy', name: 'Alloy' },
    { id: 'echo', name: 'Echo' },
    { id: 'fable', name: 'Fable' },
    { id: 'onyx', name: 'Onyx' },
    { id: 'nova', name: 'Nova' },
    { id: 'shimmer', name: 'Shimmer' }
  ],
  'coqui-xtts': [
    { id: 'default', name: 'Default' }
  ]
};

interface AudioGeneratorProps {
  onAudioGenerated?: (audioUrl: string) => void;
}

const AudioGenerator: React.FC<AudioGeneratorProps> = ({ onAudioGenerated }) => {
  const [selectedModel, setSelectedModel] = useState(AUDIO_MODELS[0].id);
  const [selectedVoice, setSelectedVoice] = useState(VOICES['elevenlabs-v2'][0].id);
  
  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    
    // Reset voice selection based on model
    const voices = VOICES[model as keyof typeof VOICES] || [];
    if (voices.length > 0) {
      setSelectedVoice(voices[0].id);
    } else {
      setSelectedVoice('');
    }
  };
  
  const ParamControls = () => (
    <div className="space-y-2">
      <Label htmlFor="voiceSelector">Voice</Label>
      <Select
        value={selectedVoice}
        onValueChange={setSelectedVoice}
      >
        <SelectTrigger id="voiceSelector">
          <SelectValue placeholder="Select a voice" />
        </SelectTrigger>
        <SelectContent>
          {(VOICES[selectedModel as keyof typeof VOICES] || []).map((voice) => (
            <SelectItem key={voice.id} value={voice.id}>
              {voice.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <UnifiedMediaGenerator
      mediaType="audio"
      title="AI Audio Generator"
      models={AUDIO_MODELS}
      defaultModel={selectedModel}
      onMediaGenerated={onAudioGenerated}
      paramControls={<ParamControls />}
    />
  );
};

export default AudioGenerator;
