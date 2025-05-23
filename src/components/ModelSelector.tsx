
// Atualizar o arquivo ModelSelector para incluir o modo "music"
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

// Make sure this function is exported correctly
export const getModelsByMode = (mode: ChatMode): ChatModel[] => {
  return AVAILABLE_MODELS.filter(model => model.modes.includes(mode));
};

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
    'apiframe': 'API Frame',
    'minimax': 'MiniMax',
    'elevenlabs': 'ElevenLabs',
    'luma': 'Luma AI',
    'suno': 'Suno AI',
    'x-ai': 'xAI',
    'deepseek': 'DeepSeek'
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

  // Group models by provider
  const modelsByProvider: Record<string, ChatModel[]> = {};
  
  models.forEach(model => {
    if (!modelsByProvider[model.provider]) {
      modelsByProvider[model.provider] = [];
    }
    modelsByProvider[model.provider].push(model);
  });

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
      <SelectContent className="bg-inventu-darker/95 backdrop-blur-lg border-white/10 max-h-[60vh]">
        {Object.entries(modelsByProvider).map(([provider, providerModels]) => (
          <React.Fragment key={provider}>
            <div className="px-2 py-1.5 text-xs font-medium text-white/60">
              {getProviderDisplayName(provider)}
            </div>
            {providerModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.displayName}
              </SelectItem>
            ))}
            <div className="my-1 border-t border-white/10"></div>
          </React.Fragment>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ModelSelector;
