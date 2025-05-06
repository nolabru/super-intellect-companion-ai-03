
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImageParameters from './ImageParameters';
import VideoParameters from './VideoParameters';
import AudioParameters from './AudioParameters';
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
    if (mode === 'audio') return 'audio';
    return 'text';
  };

  return (
    <div className="p-2">
      <Tabs defaultValue={getDefaultTab()}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="text" disabled={mode !== 'text'}>Texto</TabsTrigger>
          <TabsTrigger value="image" disabled={mode !== 'image'}>Imagem</TabsTrigger>
          <TabsTrigger value="video" disabled={mode !== 'video'}>Vídeo</TabsTrigger>
          <TabsTrigger value="audio" disabled={mode !== 'audio'}>Áudio</TabsTrigger>
        </TabsList>
        
        <TabsContent value="image">
          <ImageParameters 
            model={params.model || ''} 
            onParamsChange={onChange}
            initialParams={params}
          />
        </TabsContent>
        
        <TabsContent value="video">
          <VideoParameters 
            model={params.model || ''} 
            onParamsChange={onChange}
            initialParams={params}
          />
        </TabsContent>
        
        <TabsContent value="audio">
          <AudioParameters 
            model={params.model || ''} 
            onParamsChange={onChange}
            initialParams={params}
          />
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
