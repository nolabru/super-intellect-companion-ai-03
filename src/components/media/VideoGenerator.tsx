
import React, { useState } from 'react';
import UnifiedMediaGenerator from './UnifiedMediaGenerator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Text, ImageIcon } from 'lucide-react';
import { AVAILABLE_MODELS } from '@/constants';
import { getEnhancedModelsByMode } from '@/components/EnhancedModelSelector';

// Get video models using the enhanced filtering function
const getVideoModels = () => {
  const modelsByProvider = getEnhancedModelsByMode('video');
  return Object.values(modelsByProvider).flat().map(model => ({
    id: model.id,
    name: model.displayName,
    provider: model.provider,
    requiresReference: model.id.includes('-img') || model.id.includes('image')
  }));
};

interface VideoGeneratorProps {
  onVideoGenerated?: (videoUrl: string) => void;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ onVideoGenerated }) => {
  const VIDEO_MODELS = getVideoModels();
  const [selectedModel, setSelectedModel] = useState(VIDEO_MODELS[0]?.id || '');
  const [videoType, setVideoType] = useState<'text-to-video' | 'image-to-video'>('text-to-video');
  const [duration, setDuration] = useState<number>(5);
  const [resolution, setResolution] = useState<string>('720p');
  
  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    // Reset video type based on model capabilities
    const modelInfo = VIDEO_MODELS.find(m => m.id === model);
    if (modelInfo?.requiresReference) {
      setVideoType('image-to-video');
    }
  };
  
  const ParamControls = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Modelo</Label>
        <Select
          value={selectedModel}
          onValueChange={handleModelChange}
        >
          <SelectTrigger className="w-full bg-inventu-darker border-inventu-gray/30">
            <SelectValue placeholder="Selecione um modelo" />
          </SelectTrigger>
          <SelectContent className="bg-inventu-darker border-inventu-gray/30 text-white">
            {VIDEO_MODELS.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Tipo de Geração</Label>
        <RadioGroup 
          value={videoType}
          onValueChange={(value) => setVideoType(value as 'text-to-video' | 'image-to-video')}
          className="flex flex-col space-y-1"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="text-to-video" id="text-to-video" />
            <Label htmlFor="text-to-video" className="flex items-center gap-2">
              <Text className="h-4 w-4" />
              <span>Texto para Vídeo</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="image-to-video" id="image-to-video" />
            <Label htmlFor="image-to-video" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              <span>Imagem para Vídeo</span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>Duração</Label>
        <Select
          value={duration.toString()}
          onValueChange={(value) => setDuration(parseInt(value, 10))}
        >
          <SelectTrigger className="w-full bg-inventu-darker border-inventu-gray/30">
            <SelectValue placeholder="Selecione a duração" />
          </SelectTrigger>
          <SelectContent className="bg-inventu-darker border-inventu-gray/30 text-white">
            <SelectItem value="5">5 segundos</SelectItem>
            <SelectItem value="10">10 segundos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Resolução</Label>
        <Select
          value={resolution}
          onValueChange={(value) => setResolution(value)}
        >
          <SelectTrigger className="w-full bg-inventu-darker border-inventu-gray/30">
            <SelectValue placeholder="Selecione a resolução" />
          </SelectTrigger>
          <SelectContent className="bg-inventu-darker border-inventu-gray/30 text-white">
            <SelectItem value="540p">540p</SelectItem>
            <SelectItem value="720p">720p</SelectItem>
            <SelectItem value="1080p">1080p</SelectItem>
            <SelectItem value="4k">4K</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <UnifiedMediaGenerator
      mediaType="video"
      title="AI Video Generator"
      models={VIDEO_MODELS}
      defaultModel={selectedModel}
      onModelChange={handleModelChange}
      onMediaGenerated={onVideoGenerated}
      paramControls={<ParamControls />}
      additionalParams={{
        videoType,
        duration,
        resolution,
        model: selectedModel
      }}
    />
  );
};

export default VideoGenerator;
