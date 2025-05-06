
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImageParameters from './ImageParameters';
import VideoParameters from './VideoParameters';
import AudioParameters from './AudioParameters';
import MusicParameters from './MusicParameters';
import { ChatMode } from '@/components/ModeSelector';

interface ParametersManagerProps {
  mode: ChatMode;
  onChange: (params: any) => void;
  params: any;
  extras?: Record<string, any>;
}

const ParametersManager: React.FC<ParametersManagerProps> = ({ mode, onChange, params, extras }) => {
  // Determine qual aba deve estar ativa com base no modo
  const getDefaultTab = () => {
    if (mode === 'image') return 'image';
    if (mode === 'video') return 'video';
    if (mode === 'audio') {
      // Se o tipo de áudio for música, selecionar a aba música
      return params?.audioType === 'music' ? 'music' : 'audio';
    }
    return 'text';
  };
  
  const handleTabChange = (value: string) => {
    // Se mudar para a aba 'music', definir audioType como 'music'
    if (value === 'music') {
      onChange({ ...params, audioType: 'music' });
    } 
    // Se mudar para a aba 'audio', definir audioType como 'speech'
    else if (value === 'audio') {
      onChange({ ...params, audioType: 'speech' });
    }
  };

  return (
    <div className="p-2">
      <Tabs defaultValue={getDefaultTab()} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="text" disabled={mode !== 'text'}>Texto</TabsTrigger>
          <TabsTrigger value="image" disabled={mode !== 'image'}>Imagem</TabsTrigger>
          <TabsTrigger value="video" disabled={mode !== 'video'}>Vídeo</TabsTrigger>
          <TabsTrigger value="audio" disabled={mode !== 'audio'}>Áudio</TabsTrigger>
          {mode === 'audio' && <TabsTrigger value="music" className="mt-1">Música</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="image">
          <ImageParameters onChange={onChange} params={params} />
        </TabsContent>
        
        <TabsContent value="video">
          <VideoParameters onChange={onChange} params={params} />
        </TabsContent>
        
        <TabsContent value="audio">
          <AudioParameters onChange={onChange} params={params} />
        </TabsContent>
        
        <TabsContent value="music">
          <MusicParameters onChange={onChange} params={params} />
        </TabsContent>
        
        <TabsContent value="text">
          <div className="text-sm text-muted-foreground p-4 text-center">
            Sem parâmetros adicionais para o modo texto
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ParametersManager;
