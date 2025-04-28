
import React from 'react';
import { LumaParams } from '@/components/LumaParamsButton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface VideoParametersProps {
  model: string;
  onParamsChange: (params: LumaParams) => void;
}

const VideoParameters: React.FC<VideoParametersProps> = ({
  model,
  onParamsChange
}) => {
  const handleParamChange = (key: string, value: string) => {
    onParamsChange({
      model: 'ray-2',
      [key]: value
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Duração</Label>
        <Select
          defaultValue="5s"
          onValueChange={(value) => handleParamChange('duration', value)}
        >
          <SelectTrigger className="w-full bg-inventu-darker border-inventu-gray/30">
            <SelectValue placeholder="Selecione a duração" />
          </SelectTrigger>
          <SelectContent className="bg-inventu-darker border-inventu-gray/30">
            <SelectItem value="3s">3 segundos</SelectItem>
            <SelectItem value="5s">5 segundos</SelectItem>
            <SelectItem value="8s">8 segundos</SelectItem>
            <SelectItem value="10s">10 segundos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Resolução</Label>
        <Select
          defaultValue="720p"
          onValueChange={(value) => handleParamChange('resolution', value)}
        >
          <SelectTrigger className="w-full bg-inventu-darker border-inventu-gray/30">
            <SelectValue placeholder="Selecione a resolução" />
          </SelectTrigger>
          <SelectContent className="bg-inventu-darker border-inventu-gray/30">
            <SelectItem value="540p">540p</SelectItem>
            <SelectItem value="720p">720p</SelectItem>
            <SelectItem value="1080p">1080p</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default VideoParameters;
