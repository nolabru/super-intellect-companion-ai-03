
import React from 'react';
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "@/components/ui/select"
import { AVAILABLE_MODELS, ChatModel } from '@/constants';
import { cn } from '@/lib/utils';
import { ChatMode } from './ModeSelector';

interface ModelSelectorProps {
  mode: ChatMode;
  selectedModel: string;
  onChange: (model: string) => void;
  availableModels?: string[];
  className?: string;
  disabled?: boolean;
}

export const getModelsByMode = (mode: ChatMode): ChatModel[] => {
  return AVAILABLE_MODELS.filter(model => model.modes.includes(mode));
};

// Add missing exports required by other components
export const canModelGenerateImages = (modelId: string): boolean => {
  const model = AVAILABLE_MODELS.find(m => m.id === modelId);
  return !!model?.capabilities?.imageGeneration;
};

export const getProviderDisplayName = (provider: string): string => {
  const providerNames: Record<string, string> = {
    'openai': 'OpenAI',
    'anthropic': 'Anthropic',
    'google': 'Google',
    'kligin': 'Kligin',
    'ideogram': 'Ideogram',
    'minimax': 'MiniMax',
    'elevenlabs': 'ElevenLabs',
    'luma': 'Luma AI'
  };
  
  return providerNames[provider] || provider;
};

// Re-export constants for other components
export { AVAILABLE_MODELS };

const ModelSelector: React.FC<ModelSelectorProps> = ({
  mode,
  selectedModel,
  onChange,
  availableModels,
  className,
  disabled
}) => {
  const models = availableModels && availableModels.length > 0
    ? AVAILABLE_MODELS.filter(model => availableModels.includes(model.id))
    : getModelsByMode(mode);

  return (
    <Select
      value={selectedModel}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger 
        className={cn(
          "h-9 bg-black/20 border-white/10 text-white text-sm",
          "hover:bg-white/5 focus:ring-inventu-blue/30",
          "data-[placeholder]:text-white/60",
          className
        )}
      >
        <SelectValue placeholder="Selecione um modelo" />
      </SelectTrigger>
      <SelectContent className="bg-inventu-darker/95 backdrop-blur-lg border-white/10">
        {models.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            {model.displayName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ModelSelector;
