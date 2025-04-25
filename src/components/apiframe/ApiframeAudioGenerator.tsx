
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
import { Progress } from '@/components/ui/progress';

const AUDIO_MODELS = [
  { id: 'mmaudio-txt2audio', name: 'MMAudio Text to Audio' },
  { id: 'mmaudio-video2audio', name: 'MMAudio Video to Audio', requiresReference: true },
  { id: 'diffrhythm-base', name: 'DiffRhythm Base' },
  { id: 'diffrhythm-full', name: 'DiffRhythm Full' },
  { id: 'elevenlabs', name: 'ElevenLabs TTS' }
];

interface ApiframeAudioGeneratorProps {
  onAudioGenerated?: (audioUrl: string) => void;
}

const ApiframeAudioGenerator: React.FC<ApiframeAudioGeneratorProps> = ({ onAudioGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(AUDIO_MODELS[0].id);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [audioLength, setAudioLength] = useState<string>('90s');
  
  const { generateAudio, isGenerating, isApiKeyConfigured, currentTask } = useAudioGeneration();
  
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      return;
    }

    const params: ApiframeAudioParams = {
      // Use properly typed parameters
      length: audioLength
    };
    
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
            onValueChange={(value) => setSelectedModel(value)}
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
        
        <div className="space-y-2">
          <Label htmlFor="audioLength">Audio Length</Label>
          <Select
            value={audioLength}
            onValueChange={(value) => setAudioLength(value)}
            disabled={isGenerating || selectedModel === 'elevenlabs'}
          >
            <SelectTrigger id="audioLength">
              <SelectValue placeholder="Select length" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30s">30 seconds</SelectItem>
              <SelectItem value="1m">1 minute</SelectItem>
              <SelectItem value="90s">1.5 minutes</SelectItem>
              <SelectItem value="2m">2 minutes</SelectItem>
              <SelectItem value="3m">3 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="audioPrompt">
            {selectedModel === 'elevenlabs' ? 'Text to Speak' : 'Audio Description'}
          </Label>
          <Textarea
            id="audioPrompt"
            placeholder={
              selectedModel === 'elevenlabs' 
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
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Generating Audio...</Label>
              <span className="text-xs text-muted-foreground">
                {currentTask.progress}%
              </span>
            </div>
            <Progress value={currentTask.progress} />
          </div>
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
