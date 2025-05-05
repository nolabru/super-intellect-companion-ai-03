
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface MediaModelSelectorProps {
  models: Array<{ id: string; name: string }>;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

const MediaModelSelector: React.FC<MediaModelSelectorProps> = ({
  models,
  selectedModel,
  onModelChange,
  disabled = false
}) => {
  // Find the selected model name for display
  const selectedModelName = models.find(model => model.id === selectedModel)?.name || '';

  return (
    <div className="space-y-2">
      <Label htmlFor="modelSelector">Model</Label>
      <Select
        value={selectedModel}
        onValueChange={onModelChange}
        disabled={disabled}
      >
        <SelectTrigger id="modelSelector">
          <SelectValue placeholder="Select a model">
            {selectedModelName}
          </SelectValue>
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
