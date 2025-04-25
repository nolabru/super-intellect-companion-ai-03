
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export type VideoModelType = 
  | 'kling-text' 
  | 'kling-image' 
  | 'hunyuan-fast' 
  | 'hunyuan-standard' 
  | 'hailuo-text' 
  | 'hailuo-image';

export interface VideoModel {
  id: VideoModelType;
  name: string;
  requiresImage?: boolean;
}

export const VIDEO_MODELS: VideoModel[] = [
  { id: 'kling-text', name: 'Kling (Text to Video)' },
  { id: 'kling-image', name: 'Kling (Image to Video)', requiresImage: true },
  { id: 'hunyuan-fast', name: 'HunYuan Fast' },
  { id: 'hunyuan-standard', name: 'HunYuan Standard' },
  { id: 'hailuo-text', name: 'Hailuo (Text to Video)' },
  { id: 'hailuo-image', name: 'Hailuo (Image to Video)', requiresImage: true }
];

interface VideoModelSelectorProps {
  selectedModel: VideoModelType;
  onModelChange: (model: VideoModelType) => void;
  disabled?: boolean;
}

const VideoModelSelector: React.FC<VideoModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  disabled
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="videoModel">Model</Label>
      <Select 
        value={selectedModel}
        onValueChange={onModelChange}
        disabled={disabled}
      >
        <SelectTrigger id="videoModel">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          {VIDEO_MODELS.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              {model.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default VideoModelSelector;
