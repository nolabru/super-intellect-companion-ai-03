import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectGroup,
  SelectLabel
} from "@/components/ui/select"
import { AVAILABLE_MODELS, ChatModel, OPENROUTER_MODELS_BY_PROVIDER } from '@/constants';
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

// Make sure this function returns models that include API Frame models
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
    'openrouter': 'OpenRouter',
    'xai': 'xAI',
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
  const [loading, setLoading] = useState(false);
  const { isApiKeyConfigured } = useOpenRouterGeneration();
  
  // Get base models and OpenRouter models for the selected mode
  const baseModels = getModelsByMode(mode).filter(model => 
    !model.id.includes('/') // Filter out OpenRouter models with provider prefix
  );
  
  // Prepare all models based on mode
  let combinedModels = [...baseModels];
  
  // Make sure to include API Frame models for image mode
  if (mode === 'image') {
    // Add API Frame models for image mode
    const apiFrameImageModels = [
      { 
        id: 'ideogram-v2', 
        displayName: 'Ideogram V2', 
        provider: 'apiframe',
        modes: ['image'],
        description: 'High quality image generation'
      },
      { 
        id: 'midjourney', 
        displayName: 'Midjourney', 
        provider: 'apiframe',
        modes: ['image'],
        description: 'Artistic image generation'
      }
    ];
    combinedModels.push(...apiFrameImageModels);
  }
  
  // Add OpenRouter models if in text mode and API key is configured
  if (mode === 'text' && isApiKeyConfigured()) {
    // For text mode, add all OpenRouter models grouped by provider
    Object.entries(OPENROUTER_MODELS_BY_PROVIDER).forEach(([provider, models]) => {
      combinedModels.push(...models);
    });
  }
  
  // Filter by available models if provided
  const models = availableModels && availableModels.length > 0
    ? combinedModels.filter(model => availableModels.includes(model.id))
    : combinedModels;

  // Group models by provider
  const modelsByProvider: Record<string, ChatModel[]> = {};
  
  models.forEach(model => {
    const provider = model.id.includes('/') ? model.id.split('/')[0] : model.provider;
    
    if (!modelsByProvider[provider]) {
      modelsByProvider[provider] = [];
    }
    modelsByProvider[provider].push(model);
  });

  // Check if selected model is valid, if not select the first available model
  useEffect(() => {
    const isModelValid = models.some(model => model.id === selectedModel);
    
    if (!isModelValid && models.length > 0 && !disabled) {
      // Select the first available model
      onChange(models[0].id);
    }
  }, [selectedModel, models, onChange, disabled]);

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
          <SelectGroup key={provider}>
            <SelectLabel className="px-2 py-1.5 text-xs font-medium text-white/60">
              {getProviderDisplayName(provider)}
            </SelectLabel>
            
            {providerModels.map((model) => (
              <SelectItem 
                key={model.id} 
                value={model.id}
                className="relative"
              >
                <div className="flex flex-col">
                  <span>{model.displayName}</span>
                  {model.description && (
                    <span className="text-xs text-white/60">{model.description}</span>
                  )}
                </div>
              </SelectItem>
            ))}
            <div className="my-1 border-t border-white/10"></div>
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ModelSelector;
