
import React, { useState } from 'react';
import UnifiedMediaGenerator from './UnifiedMediaGenerator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

// Modelos SUNO AI
const AUDIO_MODELS = [
  { id: 'chirp-v3-0', name: 'Suno Chirp v3.0 (Básico)' },
  { id: 'chirp-v3-5', name: 'Suno Chirp v3.5 (Intermediário)' },
  { id: 'chirp-v4', name: 'Suno Chirp v4 (Avançado)' }
];

interface AudioGeneratorProps {
  onAudioGenerated?: (audioUrl: string) => void;
}

const AudioGenerator: React.FC<AudioGeneratorProps> = ({ onAudioGenerated }) => {
  const [selectedModel, setSelectedModel] = useState(AUDIO_MODELS[2].id);
  const [generationMode, setGenerationMode] = useState<'prompt' | 'lyrics'>('prompt');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [instrumental, setInstrumental] = useState(false);
  
  const ParamControls = () => {
    return (
      <div className="space-y-4">
        <div className="flex flex-col space-y-2">
          <Label htmlFor="model">Modelo</Label>
          <Select 
            value={selectedModel} 
            onValueChange={(value) => setSelectedModel(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um modelo" />
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

        <div className="flex items-center justify-between">
          <Label>Modo de Geração</Label>
          <div className="flex items-center space-x-2">
            <Label htmlFor="generation-mode" className={generationMode === 'prompt' ? 'text-primary' : 'text-muted-foreground'}>
              Descrição
            </Label>
            <Switch
              id="generation-mode"
              checked={generationMode === 'lyrics'}
              onCheckedChange={(checked) => {
                setGenerationMode(checked ? 'lyrics' : 'prompt');
              }}
            />
            <Label htmlFor="generation-mode" className={generationMode === 'lyrics' ? 'text-primary' : 'text-muted-foreground'}>
              Letra
            </Label>
          </div>
        </div>

        {generationMode === 'lyrics' && (
          <div>
            <Label htmlFor="lyrics">Letra da Música</Label>
            <Textarea
              id="lyrics"
              placeholder="Digite aqui a letra da sua música..."
              className="h-24"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Digite a letra completa da música que deseja gerar.
            </p>
          </div>
        )}

        <div className="pt-2">
          <Label className="font-medium">Configurações Adicionais</Label>
          <div className="mt-2 space-y-4">
            <div>
              <Label htmlFor="title">Título da Música</Label>
              <input
                id="title"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Título (opcional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="tags">Tags (estilo musical)</Label>
              <input
                id="tags"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Ex: rap, eletrônico, pop, rock (opcional)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Separe os estilos com vírgulas
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="instrumental"
                checked={instrumental}
                onCheckedChange={setInstrumental}
              />
              <Label htmlFor="instrumental">Somente Instrumental (sem voz)</Label>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Parâmetros adicionais para o gerador baseado no modelo SUNO
  const additionalParams = {
    sunoModel: selectedModel,
    title,
    tags,
    instrumental,
    audioType: 'music',
    modelType: 'music',
  };

  return (
    <UnifiedMediaGenerator
      mediaType="audio"
      title="Gerador de Música AI"
      models={AUDIO_MODELS}
      defaultModel={selectedModel}
      onModelChange={setSelectedModel}
      onMediaGenerated={onAudioGenerated}
      paramControls={<ParamControls />}
      additionalParams={additionalParams}
    />
  );
};

export default AudioGenerator;
