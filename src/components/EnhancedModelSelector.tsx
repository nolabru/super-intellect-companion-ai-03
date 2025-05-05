
import React, { useMemo } from 'react';
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

interface EnhancedModelSelectorProps {
  mode: ChatMode;
  selectedModel: string;
  onChange: (model: string) => void;
  availableModels?: string[];
  className?: string;
  disabled?: boolean;
}

// Enhanced function to get models by mode with provider filtering if needed
export const getEnhancedModelsByMode = (mode: ChatMode): Record<string, ChatModel[]> => {
  // First filter models by mode
  const filteredModels = AVAILABLE_MODELS.filter(model => model.modes.includes(mode));
  
  // Group models by provider
  const modelsByProvider: Record<string, ChatModel[]> = {};
  
  filteredModels.forEach(model => {
    if (!modelsByProvider[model.provider]) {
      modelsByProvider[model.provider] = [];
    }
    modelsByProvider[model.provider].push(model);
  });
  
  return modelsByProvider;
};

// Helper function to get provider display name
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
    'kling': 'Kling AI'
  };
  
  return providerNames[provider] || provider;
};

const EnhancedModelSelector: React.FC<EnhancedModelSelectorProps> = ({
  mode,
  selectedModel,
  onChange,
  availableModels,
  className,
  disabled
}) => {
  // Get models by mode and provider using memoization for performance
  const modelsByProvider = useMemo(() => {
    if (availableModels && availableModels.length > 0) {
      // Filter by provided available models list
      const filteredModelsByProvider: Record<string, ChatModel[]> = {};
      const filteredModels = AVAILABLE_MODELS.filter(model => 
        availableModels.includes(model.id) && model.modes.includes(mode)
      );
      
      filteredModels.forEach(model => {
        if (!filteredModelsByProvider[model.provider]) {
          filteredModelsByProvider[model.provider] = [];
        }
        filteredModelsByProvider[model.provider].push(model);
      });
      
      return filteredModelsByProvider;
    }
    
    return getEnhancedModelsByMode(mode);
  }, [mode, availableModels]);
  
  // Custom order for providers
  const providerOrder = ['openai', 'anthropic', 'google', 'luma', 'kling', 'apiframe', 'elevenlabs', 'kligin', 'minimax'];
  
  // Sort the providers based on our custom order
  const sortedProviders = Object.keys(modelsByProvider).sort((a, b) => {
    const indexA = providerOrder.indexOf(a);
    const indexB = providerOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  // If no model is selected or the selected model is not available for the current mode,
  // select the first available model
  React.useEffect(() => {
    if (sortedProviders.length > 0) {
      const allAvailableModels = Object.values(modelsByProvider).flat().map(model => model.id);
      
      if (!selectedModel || !allAvailableModels.includes(selectedModel)) {
        // Find the first model from the first provider
        const firstProviderModels = modelsByProvider[sortedProviders[0]];
        if (firstProviderModels && firstProviderModels.length > 0) {
          onChange(firstProviderModels[0].id);
        }
      }
    }
  }, [mode, modelsByProvider, selectedModel, sortedProviders, onChange]);

  // If no models are available for the current mode, show a disabled select
  if (sortedProviders.length === 0) {
    return (
      <Select disabled value="" onValueChange={() => {}}>
        <SelectTrigger 
          className={cn(
            "h-9 bg-black/20 border-white/10 text-white text-sm",
            "hover:bg-white/5 focus:ring-inventu-blue/30",
            "data-[placeholder]:text-white/60",
            className
          )}
        >
          <SelectValue placeholder="Nenhum modelo disponível" />
        </SelectTrigger>
        <SelectContent />
      </Select>
    );
  }

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
        {sortedProviders.map((provider) => (
          <React.Fragment key={provider}>
            <div className="px-2 py-1.5 text-xs font-medium text-white/60">
              {getProviderDisplayName(provider)}
            </div>
            {modelsByProvider[provider].map((model) => (
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

export default EnhancedModelSelector;
