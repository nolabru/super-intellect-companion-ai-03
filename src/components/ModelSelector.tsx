
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, ChevronRight } from 'lucide-react';

export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'kligin' | 'minimax' | 'elevenlabs' | 'ideogram' | 'luma' | 'replicate';
export type ModelMode = 'text' | 'image' | 'audio' | 'video';

export interface ModelInfo {
  id: string;
  displayName: string;
  provider: ModelProvider;
  capabilities: string[];
  description: string;
  modes: ModelMode[];
}

export const AVAILABLE_MODELS: ModelInfo[] = [
  // OpenAI Models
  {
    id: 'gpt-4-turbo',
    displayName: 'GPT-4 Turbo',
    provider: 'openai',
    capabilities: ['Raciocínio avançado', 'Conhecimento atualizado até 2023'],
    description: 'Modelo mais poderoso da OpenAI, com excelente raciocínio.',
    modes: ['text'],
  },
  {
    id: 'gpt-4-vision',
    displayName: 'GPT-4 Vision',
    provider: 'openai',
    capabilities: ['Análise de imagens', 'Raciocínio avançado'],
    description: 'Modelo capaz de analisar imagens e responder perguntas sobre elas.',
    modes: ['text'],
  },
  {
    id: 'gpt-3.5-turbo',
    displayName: 'GPT-3.5 Turbo',
    provider: 'openai',
    capabilities: ['Respostas rápidas', 'Bom custo-benefício'],
    description: 'Modelo equilibrado entre custo e capacidade.',
    modes: ['text'],
  },
  {
    id: 'dall-e-3',
    displayName: 'DALL-E 3',
    provider: 'openai',
    capabilities: ['Geração de imagens realistas', 'Seguir instruções detalhadas'],
    description: 'Gerador de imagens avançado da OpenAI.',
    modes: ['image'],
  },
  {
    id: 'tts-1',
    displayName: 'TTS-1',
    provider: 'openai',
    capabilities: ['Conversão de texto para fala', 'Voz natural'],
    description: 'Modelo de conversão de texto para fala com qualidade natural.',
    modes: ['audio'],
  },
  
  // Anthropic Models
  {
    id: 'claude-3-opus',
    displayName: 'Claude 3 Opus',
    provider: 'anthropic',
    capabilities: ['Pensamento de ponta', 'Conhecimento científico avançado'],
    description: 'O modelo mais poderoso da Anthropic, com capacidades cognitivas superiores.',
    modes: ['text'],
  },
  {
    id: 'claude-3-sonnet',
    displayName: 'Claude 3 Sonnet',
    provider: 'anthropic',
    capabilities: ['Equilíbrio entre desempenho e velocidade', 'Excelente em redação'],
    description: 'Equilíbrio entre potência e velocidade para uso geral.',
    modes: ['text'],
  },
  {
    id: 'claude-3-haiku',
    displayName: 'Claude 3 Haiku',
    provider: 'anthropic',
    capabilities: ['Respostas rápidas', 'Eficiente para tarefas simples'],
    description: 'Modelo mais rápido da Anthropic, ideal para interações frequentes.',
    modes: ['text'],
  },
  
  // Google Models
  {
    id: 'gemini-pro',
    displayName: 'Gemini Pro',
    provider: 'google',
    capabilities: ['Multimodal', 'Conhecimento amplo'],
    description: 'Modelo multimodal avançado do Google.',
    modes: ['text'],
  },
  {
    id: 'gemini-vision',
    displayName: 'Gemini Vision',
    provider: 'google',
    capabilities: ['Análise de imagens', 'Compreensão visual'],
    description: 'Modelo especializado em análise e compreensão de imagens.',
    modes: ['text'],
  },
  {
    id: 'imagen',
    displayName: 'Imagen',
    provider: 'google',
    capabilities: ['Geração de imagens', 'Alta fidelidade'],
    description: 'Gerador de imagens de alta fidelidade do Google.',
    modes: ['image'],
  },
  
  // Ideogram Models  
  {
    id: 'ideogram',
    displayName: 'Ideogram',
    provider: 'ideogram',
    capabilities: ['Geração artística', 'Estilos diversos'],
    description: 'Gerador de imagens focado em diversos estilos artísticos.',
    modes: ['image'],
  },
  
  // Luma Models
  {
    id: 'luma-video',
    displayName: 'Luma Video',
    provider: 'luma',
    capabilities: ['Geração de vídeos', 'Movimentos fluidos'],
    description: 'Gerador de vídeos curtos com movimentos naturais.',
    modes: ['video'],
  },
  {
    id: 'luma-image',
    displayName: 'Luma Image',
    provider: 'luma',
    capabilities: ['Imagens 3D', 'Visualização especial'],
    description: 'Criação de imagens com representação tridimensional.',
    modes: ['image'],
  },
  
  // ElevenLabs Models
  {
    id: 'elevenlabs-tts',
    displayName: 'ElevenLabs TTS',
    provider: 'elevenlabs',
    capabilities: ['Vozes realistas', 'Múltiplos idiomas'],
    description: 'Conversão de texto para fala com vozes extremamente realistas.',
    modes: ['audio'],
  },
  
  // Kligin Models
  {
    id: 'kligin-tts',
    displayName: 'Kligin TTS',
    provider: 'kligin',
    capabilities: ['Vozes brasileiras', 'Naturalidade'],
    description: 'Conversão de texto para fala com vozes brasileiras naturais.',
    modes: ['audio'],
  },
  
  // MiniMax Models
  {
    id: 'minimax',
    displayName: 'MiniMax',
    provider: 'minimax',
    capabilities: ['Linguagem fluente', 'Respostas rápidas'],
    description: 'Modelo equilibrado entre qualidade e velocidade de resposta.',
    modes: ['text'],
  },
  
  // Replicate Models
  {
    id: 'replicate-sdxl',
    displayName: 'Stable Diffusion XL',
    provider: 'replicate',
    capabilities: ['Geração de imagens', 'Código aberto'],
    description: 'Modelo de código aberto para geração de imagens de alta qualidade.',
    modes: ['image'],
  },
];

export const getModelsByMode = (mode: ModelMode): ModelInfo[] => {
  return AVAILABLE_MODELS.filter(model => model.modes.includes(mode));
};

export const canModelGenerateImages = (modelId: string): boolean => {
  const model = AVAILABLE_MODELS.find(m => m.id === modelId);
  return !!(model && model.modes.includes('image'));
};

interface ModelSelectorProps {
  selectedModel: string;
  onChange: (model: string) => void;
  mode?: ModelMode;
  disabled?: boolean;
  className?: string;
}

const getProviderDisplayName = (provider: ModelProvider): string => {
  switch (provider) {
    case 'openai':
      return 'OpenAI';
    case 'anthropic':
      return 'Anthropic';
    case 'google':
      return 'Google';
    case 'kligin':
      return 'Kligin';
    case 'minimax':
      return 'MiniMax';
    case 'elevenlabs':
      return 'ElevenLabs';
    case 'ideogram':
      return 'Ideogram';
    case 'luma':
      return 'Luma AI';
    case 'replicate':
      return 'Replicate';
    default:
      return provider;
  }
};

export { getProviderDisplayName };

const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  selectedModel, 
  onChange, 
  mode, 
  disabled = false,
  className = ''
}) => {
  const selectedModelInfo = AVAILABLE_MODELS.find(m => m.id === selectedModel);
  
  const getModelsForProvider = (provider: ModelProvider): ModelInfo[] => {
    return AVAILABLE_MODELS.filter(model => 
      model.provider === provider && 
      (mode ? model.modes.includes(mode) : true)
    );
  };
  
  const getAvailableProviders = (): ModelProvider[] => {
    const providers = new Set<ModelProvider>();
    
    AVAILABLE_MODELS.forEach(model => {
      if (!mode || model.modes.includes(mode)) {
        providers.add(model.provider);
      }
    });
    
    return Array.from(providers);
  };
  
  const getProviderIcon = (provider: ModelProvider) => {
    // Placeholder for provider icons - could be improved with actual icons
    switch (provider) {
      case 'openai':
        return '🟢';
      case 'anthropic':
        return '🟣';
      case 'google':
        return '🔵';
      case 'kligin':
        return '🟠';
      case 'minimax':
        return '🔴';
      case 'elevenlabs':
        return '🔊';
      case 'ideogram':
        return '🎨';
      case 'luma':
        return '🎬';
      case 'replicate':
        return '⚙️';
      default:
        return '•';
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button 
          className={`flex items-center justify-between w-full px-3 py-2 rounded-md border border-white/10 bg-black/40 text-sm text-white ring-offset-background 
                     backdrop-blur-sm transition-all hover:bg-black/50 hover:border-white/20
                     focus:outline-none focus:ring-1 focus:ring-white/30 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        >
          <span className="flex items-center gap-2">
            {selectedModelInfo && (
              <span className="text-xs opacity-70 font-medium">
                {getProviderIcon(selectedModelInfo.provider)}
              </span>
            )}
            <span className="font-medium">{selectedModelInfo?.displayName || 'Selecionar Modelo'}</span>
          </span>
          <ChevronDown className="h-4 w-4 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-[200px] bg-black/90 backdrop-blur-xl border-white/10 shadow-xl rounded-xl p-1"
      >
        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-white/60 px-3 py-2">
          Selecione um modelo
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        
        {getAvailableProviders().map(provider => {
          const modelsForProvider = getModelsForProvider(provider);
          
          if (modelsForProvider.length === 0) return null;
          
          return (
            <DropdownMenuSub key={provider}>
              <DropdownMenuSubTrigger className="flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/5 rounded-lg mx-1 my-0.5">
                <span className="text-sm">{getProviderIcon(provider)}</span>
                <span>{getProviderDisplayName(provider)}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent 
                  className="bg-black/90 backdrop-blur-xl border-white/10 shadow-xl rounded-xl p-1 min-w-[180px]"
                  sideOffset={-5}
                  alignOffset={-5}
                >
                  {modelsForProvider.map(model => (
                    <DropdownMenuItem 
                      key={model.id}
                      className={`gap-2 px-3 py-2 flex flex-col items-start rounded-lg mx-1 my-0.5 cursor-pointer
                                ${selectedModel === model.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                      onClick={() => onChange(model.id)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium text-white">{model.displayName}</span>
                        {model.modes.map(modelMode => (
                          <span 
                            key={modelMode} 
                            className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/70"
                          >
                            {modelMode}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-white/60 w-full">
                        {model.description}
                      </p>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          );
        })}
        
        {/* Opção "Mais modelos" como no exemplo */}
        <DropdownMenuItem 
          className="flex items-center justify-between gap-2 px-3 py-2 mt-1 text-sm text-white hover:bg-white/5 rounded-lg mx-1 my-0.5 cursor-pointer"
        >
          <span className="font-medium">Mais modelos</span>
          <ChevronRight className="h-4 w-4 opacity-70" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ModelSelector;
