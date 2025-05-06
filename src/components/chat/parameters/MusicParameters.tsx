
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MusicParametersProps {
  onChange: (params: any) => void;
  params: any;
}

const MusicParameters: React.FC<MusicParametersProps> = ({ onChange, params = {} }) => {
  // Modelo padrão
  const [model, setModel] = useState<string>(params.sunoModel || 'chirp-v4');
  
  // Modo de geração (prompt ou lyrics)
  const [generationMode, setGenerationMode] = useState<'prompt' | 'lyrics'>(
    params.lyrics ? 'lyrics' : 'prompt'
  );
  
  // Parâmetros avançados
  const [title, setTitle] = useState<string>(params.title || '');
  const [tags, setTags] = useState<string>(params.tags || '');
  const [instrumental, setInstrumental] = useState<boolean>(params.instrumental || false);
  
  // Handle para atualização do prompt ou lyrics
  const handleContentChange = (value: string) => {
    if (generationMode === 'prompt') {
      onChange({
        ...params,
        prompt: value,
        lyrics: undefined,
        sunoModel: model,
        title,
        tags,
        instrumental,
        audioType: 'music'
      });
    } else {
      onChange({
        ...params,
        lyrics: value,
        prompt: undefined,
        sunoModel: model,
        title,
        tags,
        instrumental,
        audioType: 'music'
      });
    }
  };

  // Atualizar parâmetros quando qualquer campo for alterado
  const updateParams = () => {
    onChange({
      ...params,
      sunoModel: model,
      title,
      tags,
      instrumental,
      audioType: 'music'
    });
  };

  // Alternar entre modo prompt e lyrics
  const toggleGenerationMode = () => {
    const newMode = generationMode === 'prompt' ? 'lyrics' : 'prompt';
    setGenerationMode(newMode);
    
    // Limpar o campo oposto quando alternar
    if (newMode === 'prompt') {
      onChange({
        ...params,
        prompt: params.prompt || '',
        lyrics: undefined,
        sunoModel: model,
        title,
        tags,
        instrumental,
        audioType: 'music'
      });
    } else {
      onChange({
        ...params,
        lyrics: params.lyrics || '',
        prompt: undefined,
        sunoModel: model,
        title,
        tags,
        instrumental,
        audioType: 'music'
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <Label htmlFor="model">Modelo</Label>
        <Select 
          value={model} 
          onValueChange={(value) => {
            setModel(value);
            onChange({
              ...params,
              sunoModel: value,
              audioType: 'music'
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um modelo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="chirp-v3-0">Chirp v3.0 (Básico)</SelectItem>
            <SelectItem value="chirp-v3-5">Chirp v3.5 (Intermediário)</SelectItem>
            <SelectItem value="chirp-v4">Chirp v4 (Avançado)</SelectItem>
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
            onCheckedChange={toggleGenerationMode}
          />
          <Label htmlFor="generation-mode" className={generationMode === 'lyrics' ? 'text-primary' : 'text-muted-foreground'}>
            Letra
          </Label>
        </div>
      </div>

      {generationMode === 'lyrics' ? (
        <div>
          <Label htmlFor="lyrics">Letra da Música</Label>
          <Textarea
            id="lyrics"
            placeholder="Digite aqui a letra da sua música..."
            value={params.lyrics || ''}
            onChange={(e) => handleContentChange(e.target.value)}
            className="h-24"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Digite a letra completa da música que deseja gerar.
          </p>
        </div>
      ) : null}

      <div className="pt-2">
        <Label className="font-medium">Configurações Adicionais</Label>
        <div className="mt-2 space-y-4">
          <div>
            <Label htmlFor="title">Título da Música</Label>
            <Input
              id="title"
              placeholder="Título (opcional)"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                updateParams();
              }}
            />
          </div>
          
          <div>
            <Label htmlFor="tags">Tags (estilo musical)</Label>
            <Input
              id="tags"
              placeholder="Ex: rap, eletrônico, pop, rock (opcional)"
              value={tags}
              onChange={(e) => {
                setTags(e.target.value);
                updateParams();
              }}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Separe os estilos com vírgulas
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="instrumental"
              checked={instrumental}
              onCheckedChange={(checked) => {
                setInstrumental(checked);
                onChange({
                  ...params,
                  instrumental: checked,
                  audioType: 'music'
                });
              }}
            />
            <Label htmlFor="instrumental">Somente Instrumental (sem voz)</Label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicParameters;
