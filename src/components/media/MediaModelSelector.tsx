
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { getEnhancedModelsByMode } from '@/components/EnhancedModelSelector';
import { ChatMode } from '@/components/ModeSelector';

interface MediaModelSelectorProps {
  mode: ChatMode;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

const MediaModelSelector: React.FC<MediaModelSelectorProps> = ({
  mode,
  selectedModel,
  onModelChange,
  disabled = false
}) => {
  // Get all models available for the current mode
  const modelsByProvider = getEnhancedModelsByMode(mode);
  
  // Flatten models for simple display
  const models = Object.values(modelsByProvider).flat().map(model => ({
    id: model.id,
    name: model.displayName
  }));

  return (
    <div className="space-y-2">
      <Label htmlFor="modelSelector">Model</Label>
      <Select
        value={selectedModel}
        onValueChange={onModelChange}
        disabled={disabled || models.length === 0}
      >
        <SelectTrigger id="modelSelector">
          <SelectValue placeholder={models.length === 0 ? "No models available" : "Select a model"} />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              {model.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default MediaModelSelector;
