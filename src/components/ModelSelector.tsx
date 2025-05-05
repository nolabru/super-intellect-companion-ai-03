
import React, { useState, useEffect } from 'react';
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
import { useOpenRouterGeneration } from '@/hooks/useOpenRouterGeneration';
import { Loader2 } from 'lucide-react';

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
    'openrouter': 'OpenRouter'
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
  const [loading, setLoading] = useState(false);
  const [openRouterModels, setOpenRouterModels] = useState<any[]>([]);
  
  const { fetchAvailableModels, isApiKeyConfigured } = useOpenRouterGeneration();
  
  // Fetch OpenRouter models on component mount
  useEffect(() => {
    const loadOpenRouterModels = async () => {
      if (mode === 'text' && isApiKeyConfigured()) {
        try {
          setLoading(true);
          const models = await fetchAvailableModels();
          setOpenRouterModels(models);
        } catch (err) {
          console.error('Error fetching OpenRouter models:', err);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadOpenRouterModels();
  }, [mode, fetchAvailableModels, isApiKeyConfigured]);
  
  // Combine OpenRouter models with regular models
  const combinedModels = [...getModelsByMode(mode)];
  
  // Add OpenRouter models if they exist and we're in text mode
  if (mode === 'text' && openRouterModels.length > 0) {
    // Create a virtual model for OpenRouter
    const openRouterModel: ChatModel = {
      id: 'openrouter',
      displayName: 'OpenRouter Models',
      provider: 'openrouter',
      modes: ['text'],
      description: 'Models from multiple providers via OpenRouter'
    };
    
    combinedModels.push(openRouterModel);
  }
  
  // Filter by available models if provided
  const models = availableModels && availableModels.length > 0
    ? combinedModels.filter(model => availableModels.includes(model.id))
    : combinedModels;

  // Group models by provider
  const modelsByProvider: Record<string, ChatModel[]> = {};
  
  models.forEach(model => {
    if (!modelsByProvider[model.provider]) {
      modelsByProvider[model.provider] = [];
    }
    modelsByProvider[model.provider].push(model);
  });
  
  // Add OpenRouter provider models
  if (openRouterModels.length > 0 && mode === 'text') {
    openRouterModels.forEach(model => {
      const provider = model.id.split('/')[0];
      
      if (!modelsByProvider[provider]) {
        modelsByProvider[provider] = [];
      }
      
      // Convert to our ChatModel format
      modelsByProvider[provider].push({
        id: model.id,
        displayName: model.name || model.id,
        provider,
        modes: ['text'],
        description: `OpenRouter: ${model.name}`
      });
    });
  }

  return (
    <Select
      value={selectedModel}
      onValueChange={onChange}
      disabled={disabled || loading}
    >
      <SelectTrigger 
        className={cn(
          "h-9 bg-black/20 border-white/10 text-white text-sm",
          "hover:bg-white/5 focus:ring-inventu-blue/30",
          "data-[placeholder]:text-white/60",
          className
        )}
      >
        <SelectValue placeholder="Selecione um modelo">
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        </SelectValue>
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
