
import React, { useState, useEffect } from 'react';
import UnifiedMediaGenerator from './UnifiedMediaGenerator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

// Updated audio models data
const AUDIO_MODELS = [
  { id: 'chirp-v4', name: 'Suno Music (Chirp v4)' },
  { id: 'chirp-v3-5', name: 'Suno Music (Chirp v3.5)' },
  { id: 'chirp-v3-0', name: 'Suno Music (Chirp v3.0)' }
];

interface AudioGeneratorProps {
  onAudioGenerated?: (audioUrl: string) => void;
}

const AudioGenerator: React.FC<AudioGeneratorProps> = ({ onAudioGenerated }) => {
  const [selectedModel, setSelectedModel] = useState(AUDIO_MODELS[0].id);
  const [generationMode, setGenerationMode] = useState<'prompt' | 'lyrics'>('prompt');
  const [prompt, setPrompt] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [isInstrumental, setIsInstrumental] = useState(false);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  
  const handleModelChange = (model: string) => {
    setSelectedModel(model);
  };
  
  const getAdditionalParams = () => {
    return {
      audioType: 'music',
      sunoModel: selectedModel,
      make_instrumental: isInstrumental,
      title,
      tags,
      ...(generationMode === 'prompt' ? { prompt } : { lyrics })
    };
  };
  
  const ParamControls = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Modo de Geração</Label>
          <div className="flex items-center space-x-2">
            <Label className={generationMode === 'prompt' ? 'text-primary' : 'text-muted-foreground'}>
              Descrição
            </Label>
            <Switch
              checked={generationMode === 'lyrics'}
              onCheckedChange={(checked) => setGenerationMode(checked ? 'lyrics' : 'prompt')}
            />
            <Label className={generationMode === 'lyrics' ? 'text-primary' : 'text-muted-foreground'}>
              Letra
            </Label>
          </div>
        </div>
        
        {generationMode === 'prompt' ? (
          <div>
            <Label htmlFor="prompt">Descrição da Música</Label>
            <Textarea
              id="prompt"
              placeholder="Descreva o estilo e tema da música..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="h-20"
            />
          </div>
        ) : (
          <div>
            <Label htmlFor="lyrics">Letra da Música</Label>
            <Textarea
              id="lyrics"
              placeholder="Digite a letra completa da música..."
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              className="h-24"
            />
          </div>
        )}
        
        <div>
          <Label htmlFor="title">Título da Música (opcional)</Label>
          <Input
            id="title"
            placeholder="Título da música"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="tags">Tags de Estilo (opcional)</Label>
          <Input
            id="tags"
            placeholder="Ex: rock, pop, rap, eletrônico"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Separe os estilos musicais com vírgulas
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="instrumental"
            checked={isInstrumental}
            onCheckedChange={setIsInstrumental}
          />
          <Label htmlFor="instrumental">Somente Instrumental (sem voz)</Label>
        </div>
      </div>
    );
  };

  return (
    <UnifiedMediaGenerator
      mediaType="audio"
      title="Gerador de Música com IA"
      models={AUDIO_MODELS}
      defaultModel={selectedModel}
      onModelChange={handleModelChange}
      onMediaGenerated={onAudioGenerated}
      paramControls={<ParamControls />}
      additionalParams={getAdditionalParams()}
    />
  );
};

export default AudioGenerator;
