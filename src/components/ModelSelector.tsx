
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ChatMode } from './ModeSelector';

// Model options for each mode
const MODEL_OPTIONS = {
  text: ['gpt-4o', 'claude-3-opus', 'claude-3-sonnet', 'llama-3'],
  image: ['gpt-4o-vision', 'claude-3-opus', 'gemini-pro-vision'],
  video: ['gpt-4o-vision', 'claude-3-opus'],
  audio: ['whisper-large-v3', 'deepgram-nova-2']
};

interface ModelSelectorProps {
  mode: ChatMode;
  selectedModel: string;
  onChange: (model: string) => void;
  className?: string;
  disabled?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  mode, 
  selectedModel, 
  onChange,
  className,
  disabled = false
}) => {
  // Get available models for the current mode
  const availableModels = MODEL_OPTIONS[mode];
  
  // If current selected model is not available for this mode, default to first option
  React.useEffect(() => {
    if (!availableModels.includes(selectedModel)) {
      onChange(availableModels[0]);
    }
  }, [mode, selectedModel, onChange, availableModels]);

  return (
    <Select value={selectedModel} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent>
        {availableModels.map(model => (
          <SelectItem key={model} value={model}>
            {model}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ModelSelector;
