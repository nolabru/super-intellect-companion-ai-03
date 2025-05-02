import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useAudioGeneration } from '@/hooks/apiframe/useAudioGeneration';
import { ApiframeAudioParams } from '@/types/apiframeGeneration';
import ApiframeConfig from './ApiframeConfig';
import MediaProgress from './common/MediaProgress';

// Updated model list based on APIframe.ai's supported models
const AUDIO_MODELS = [
  { id: 'elevenlabs-v2', name: 'ElevenLabs v2' },
  { id: 'openai-tts-1', name: 'OpenAI TTS-1' },
  { id: 'coqui-xtts', name: 'Coqui XTTS' }
];

// Voice options for ElevenLabs
const ELEVENLABS_VOICES = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam' },
  { id: 'jsCqWAovK2LkecY7zXl4', name: 'Nicole' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Thomas' }
];

// Voice options for OpenAI TTS
const OPENAI_VOICES = [
  { id: 'alloy', name: 'Alloy' },
  { id: 'echo', name: 'Echo' },
  { id: 'fable', name: 'Fable' },
  { id: 'onyx', name: 'Onyx' },
  { id: 'nova', name: 'Nova' },
  { id: 'shimmer', name: 'Shimmer' }
];

interface ApiframeAudioGeneratorProps {
  onAudioGenerated?: (audioUrl: string) => void;
}

const ApiframeAudioGenerator: React.FC<ApiframeAudioGeneratorProps> = ({ onAudioGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(AUDIO_MODELS[0].id);
  const [selectedVoice, setSelectedVoice] = useState(ELEVENLABS_VOICES[0].id);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  
  const { generateAudio, isGenerating, isApiKeyConfigured, currentTask } = useAudioGeneration();
  
  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    
    // Reset voice selection based on model
    if (model === 'elevenlabs-v2') {
      setSelectedVoice(ELEVENLABS_VOICES[0].id);
    } else if (model === 'openai-tts-1') {
      setSelectedVoice(OPENAI_VOICES[0].id);
    } else {
      setSelectedVoice('');
    }
  };
  
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      return;
    }

    let params: ApiframeAudioParams = {};
    
    // Set model-specific parameters
    if (selectedModel === 'elevenlabs-v2') {
      params = {
        voice_id: selectedVoice,
        stability: 0.5,
        similarity_boost: 0.75
      };
    } else if (selectedModel === 'openai-tts-1') {
      params = {
        voice: selectedVoice,
        speed: 1.0
      };
    } else if (selectedModel === 'coqui-xtts') {
      params = {
        language: 'en'
      };
    }
    
    const result = await generateAudio(prompt, selectedModel, params);
    
    if (result.success && result.mediaUrl) {
      setGeneratedAudio(result.mediaUrl);
      
      if (onAudioGenerated) {
        onAudioGenerated(result.mediaUrl);
      }
    }
  };

  if (!isApiKeyConfigured()) {
    return <ApiframeConfig onConfigChange={() => window.location.reload()} />;
  }

  // Determine which voice options to show based on selected model
  const voiceOptions = selectedModel === 'elevenlabs-v2' 
    ? ELEVENLABS_VOICES 
    : selectedModel === 'openai-tts-1' 
      ? OPENAI_VOICES 
      : [];

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M8 2a3 3 0 0 0-3 3v16a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
            <path d="M16 8a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0v-8a3 3 0 0 0-3-3Z"></path>
          </svg>
          <span>APIframe AI Audio Generator</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="audioModel">Model</Label>
          <Select 
            value={selectedModel}
            onValueChange={handleModelChange}
            disabled={isGenerating}
          >
            <SelectTrigger id="audioModel">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {AUDIO_MODELS.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {voiceOptions.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="voiceSelector">Voice</Label>
            <Select
              value={selectedVoice}
              onValueChange={setSelectedVoice}
              disabled={isGenerating}
            >
              <SelectTrigger id="voiceSelector">
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                {voiceOptions.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    {voice.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="audioPrompt">
            {selectedModel.includes('tts') ? 'Text to Speak' : 'Audio Description'}
          </Label>
          <Textarea
            id="audioPrompt"
            placeholder={
              selectedModel.includes('tts') 
                ? "Enter text to be converted to speech..." 
                : "Describe the audio you want to generate..."
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            disabled={isGenerating}
            className="resize-none"
          />
        </div>
        
        {isGenerating && currentTask && (
          <MediaProgress
            progress={currentTask.progress}
            type="audio"
          />
        )}
        
        {generatedAudio && !isGenerating && (
          <div className="mt-4">
            <div className="border rounded-md overflow-hidden p-4">
              <audio 
                src={generatedAudio} 
                controls 
                className="w-full" 
              />
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Audio'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiframeAudioGenerator;
