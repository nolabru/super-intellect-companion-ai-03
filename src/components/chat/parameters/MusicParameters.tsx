
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

// Suno music models
const MUSIC_MODELS = [
  { id: 'chirp-v4', name: 'Suno Music (Chirp v4)' },
  { id: 'chirp-v3-5', name: 'Suno Music (Chirp v3.5)' },
  { id: 'chirp-v3-0', name: 'Suno Music (Chirp v3.0)' }
];

interface MusicParametersProps {
  onChange: (params: any) => void;
  params: any;
}

const MusicParameters: React.FC<MusicParametersProps> = ({
  onChange,
  params
}) => {
  const [localParams, setLocalParams] = useState({
    model: params?.model || 'chirp-v4',
    generationMode: params?.generationMode || 'prompt',
    prompt: params?.prompt || '',
    lyrics: params?.lyrics || '',
    isInstrumental: params?.isInstrumental || false,
    title: params?.title || '',
    tags: params?.tags || ''
  });

  // Update when params prop changes
  useEffect(() => {
    if (params) {
      setLocalParams(prev => ({
        ...prev,
        ...params
      }));
    }
  }, [params]);

  const handleParamChange = (key: string, value: any) => {
    const newParams = {
      ...localParams,
      [key]: value
    };
    setLocalParams(newParams);
    onChange(newParams);
  };

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
            {MUSIC_MODELS.map((model) => (
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
          <Label className={localParams.generationMode === 'prompt' ? 'text-primary' : 'text-muted-foreground'}>
            Descrição
          </Label>
          <Switch
            checked={localParams.generationMode === 'lyrics'}
            onCheckedChange={(checked) => handleParamChange('generationMode', checked ? 'lyrics' : 'prompt')}
          />
          <Label className={localParams.generationMode === 'lyrics' ? 'text-primary' : 'text-muted-foreground'}>
            Letra
          </Label>
        </div>
      </div>

      {localParams.generationMode === 'prompt' ? (
        <div className="space-y-2">
          <Label htmlFor="prompt">Descrição da Música</Label>
          <Textarea
            id="prompt"
            placeholder="Descreva o estilo e tema da música..."
            value={localParams.prompt}
            onChange={(e) => handleParamChange('prompt', e.target.value)}
            className="h-20 bg-inventu-card border-inventu-gray/30"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="lyrics">Letra da Música</Label>
          <Textarea
            id="lyrics"
            placeholder="Digite a letra completa da música..."
            value={localParams.lyrics}
            onChange={(e) => handleParamChange('lyrics', e.target.value)}
            className="h-24 bg-inventu-card border-inventu-gray/30"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Título da Música (opcional)</Label>
        <Input
          id="title"
          placeholder="Título da música"
          value={localParams.title}
          onChange={(e) => handleParamChange('title', e.target.value)}
          className="bg-inventu-card border-inventu-gray/30"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags de Estilo (opcional)</Label>
        <Input
          id="tags"
          placeholder="Ex: rock, pop, rap, eletrônico"
          value={localParams.tags}
          onChange={(e) => handleParamChange('tags', e.target.value)}
          className="bg-inventu-card border-inventu-gray/30"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Separe os estilos musicais com vírgulas
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="instrumental"
          checked={localParams.isInstrumental}
          onCheckedChange={(checked) => handleParamChange('isInstrumental', checked)}
        />
        <Label htmlFor="instrumental">Somente Instrumental (sem voz)</Label>
      </div>
    </div>
  );
};

export default MusicParameters;
