
import React, { useState, useEffect } from 'react';
import UnifiedMediaGenerator from './UnifiedMediaGenerator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

// Updated audio models data
const AUDIO_MODELS = [
  { id: 'elevenlabs-v2', name: 'ElevenLabs v2' },
  { id: 'openai-tts-1', name: 'OpenAI TTS-1' },
  { id: 'coqui-xtts', name: 'Coqui XTTS' },
  { id: 'musicgen', name: 'MusicGen (Music)' },
  { id: 'audiogen', name: 'AudioGen (Sound Effects)' }
];

// Voice options for different models
const VOICES = {
  'elevenlabs-v2': [
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah' },
    { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam' },
    { id: 'jsCqWAovK2LkecY7zXl4', name: 'Nicole' },
    { id: 'XB0fDUnXU5powFXDhCwa', name: 'Thomas' },
    { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam' },
    { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel' }
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
  ],
  'musicgen': [
    { id: 'default', name: 'Default' }
  ],
  'audiogen': [
    { id: 'default', name: 'Default' }
  ]
};

interface AudioGeneratorProps {
  onAudioGenerated?: (audioUrl: string) => void;
}

const AudioGenerator: React.FC<AudioGeneratorProps> = ({ onAudioGenerated }) => {
  const [selectedModel, setSelectedModel] = useState(AUDIO_MODELS[0].id);
  const [selectedVoice, setSelectedVoice] = useState(VOICES['elevenlabs-v2'][0].id);
  const [stability, setStability] = useState(0.5);
  const [clarity, setClarity] = useState(0.5);
  
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
  
  useEffect(() => {
    handleModelChange(selectedModel);
  }, []);
  
  const ParamControls = () => {
    // Only show voice selector and sliders for TTS models
    if (!['elevenlabs-v2', 'openai-tts-1', 'coqui-xtts'].includes(selectedModel)) {
      return (
        <div className="text-sm text-muted-foreground italic">
          {selectedModel === 'musicgen' ? 
            "Music generation parameters applied automatically" : 
            "Sound generation parameters applied automatically"}
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <div>
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
        
        {selectedModel === 'elevenlabs-v2' && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="stability-slider">Stability: {stability.toFixed(2)}</Label>
              </div>
              <Slider
                id="stability-slider"
                min={0}
                max={1}
                step={0.01}
                value={[stability]}
                onValueChange={(value) => setStability(value[0])}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="clarity-slider">Clarity: {clarity.toFixed(2)}</Label>
              </div>
              <Slider
                id="clarity-slider"
                min={0}
                max={1}
                step={0.01}
                value={[clarity]}
                onValueChange={(value) => setClarity(value[0])}
              />
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <UnifiedMediaGenerator
      mediaType="audio"
      title="AI Audio Generator"
      models={AUDIO_MODELS}
      defaultModel={selectedModel}
      onModelChange={handleModelChange}
      onMediaGenerated={onAudioGenerated}
      paramControls={<ParamControls />}
      additionalParams={{ 
        voice: selectedVoice,
        stability,
        clarity,
        modelType: ['musicgen', 'audiogen'].includes(selectedModel) ? 'music' : 'speech',
        // Importante: parâmetros específicos para TTS
        voice_id: selectedModel === 'elevenlabs-v2' ? selectedVoice : undefined,
        similarity_boost: selectedModel === 'elevenlabs-v2' ? clarity : undefined,
        speed: selectedModel === 'openai-tts-1' ? 1.0 : undefined,
        language: selectedModel === 'coqui-xtts' ? 'pt' : undefined
      }}
    />
  );
};

export default AudioGenerator;
