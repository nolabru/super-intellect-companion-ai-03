
import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, ChevronRight } from 'lucide-react';

export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'kligin' | 'minimax' | 'elevenlabs' | 'ideogram' | 'luma' | 'replicate' | 'deepseek' | 'piapi';
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
  // OpenAI Models - text only
  {
    id: 'gpt-4o',
    displayName: 'GPT-4o',
    provider: 'openai',
    capabilities: ['Raciocínio avançado', 'Análise de imagens', 'Conhecimento atualizado até Apr 2023'],
    description: 'Modelo mais poderoso da OpenAI, com excelente raciocínio e análise de imagens.',
    modes: ['text']
  },
  
  // PiAPI Models - image
  {
    id: 'piapi-dalle-3',
    displayName: 'DALL-E 3 (PiAPI)',
    provider: 'piapi',
    capabilities: ['Geração de imagens realistas', 'Seguir instruções detalhadas'],
    description: 'Gerador de imagens avançado da OpenAI via PiAPI.',
    modes: ['image']
  },
  {
    id: 'piapi-sdxl',
    displayName: 'Stable Diffusion XL',
    provider: 'piapi',
    capabilities: ['Imagens de alta qualidade', 'Personalização avançada'],
    description: 'Gerador de imagens Stable Diffusion XL via PiAPI.',
    modes: ['image']
  },
  {
    id: 'piapi-midjourney',
    displayName: 'Midjourney',
    provider: 'piapi',
    capabilities: ['Imagens artísticas', 'Alta qualidade visual'],
    description: 'Gerador de imagens Midjourney via PiAPI.',
    modes: ['image']
  },
  
  // PiAPI Models - video
  {
    id: 'piapi-gen2',
    displayName: 'Runway Gen-2',
    provider: 'piapi',
    capabilities: ['Geração de vídeos', 'Animações fluidas'],
    description: 'Gerador de vídeos Runway Gen-2 via PiAPI.',
    modes: ['video']
  },
  {
    id: 'piapi-pika',
    displayName: 'Pika Labs',
    provider: 'piapi',
    capabilities: ['Vídeos criativos', 'Efeitos visuais'],
    description: 'Gerador de vídeos Pika Labs via PiAPI.',
    modes: ['video']
  },
  
  // PiAPI Models - audio
  {
    id: 'piapi-elevenlabs',
    displayName: 'ElevenLabs (PiAPI)',
    provider: 'piapi',
    capabilities: ['Conversão de texto em áudio', 'Múltiplas vozes', 'Alta qualidade'],
    description: 'Serviço de conversão de texto em áudio ElevenLabs via PiAPI.',
    modes: ['audio']
  },
  {
    id: 'piapi-openai-tts',
    displayName: 'OpenAI TTS (PiAPI)',
    provider: 'piapi',
    capabilities: ['Conversão de texto em áudio', 'Voz sintética de alta qualidade'],
    description: 'Serviço de conversão de texto em áudio da OpenAI via PiAPI.',
    modes: ['audio']
  }
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
    case 'deepseek':
      return 'DeepSeek';
    case 'piapi':
      return 'PiAPI';
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
    return AVAILABLE_MODELS.filter(model => model.provider === provider && (mode ? model.modes.includes(mode) : true));
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
      case 'deepseek':
        return '⚫';
      default:
        return '•';
    }
  };
  return <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button className={`flex items-center justify-between w-full px-3 py-2 rounded-md border border-white/10 bg-black/40 text-sm text-white ring-offset-background 
                     backdrop-blur-sm transition-all hover:bg-black/50 hover:border-white/20
                     focus:outline-none focus:ring-1 focus:ring-white/30 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}>
          <span className="flex items-center gap-2">
            {selectedModelInfo && <span className="text-xs opacity-70 font-medium">
                {getProviderIcon(selectedModelInfo.provider)}
              </span>}
            <span className="font-medium">{selectedModelInfo?.displayName || 'Selecionar Modelo'}</span>
          </span>
          <ChevronDown className="h-4 w-4 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px] bg-black/90 backdrop-blur-xl border-white/10 shadow-xl rounded-xl p-1">
        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-white/60 px-3 py-2">
          Selecione um modelo
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        
        {getAvailableProviders().map(provider => {
        const modelsForProvider = getModelsForProvider(provider);
        if (modelsForProvider.length === 0) return null;
        return <DropdownMenuSub key={provider}>
              <DropdownMenuSubTrigger className="flex items-center justify-between gap-2 px-3 py-2 text-sm text-white hover:bg-white/5 rounded-lg mx-1 my-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{getProviderIcon(provider)}</span>
                  <span>{getProviderDisplayName(provider)}</span>
                </div>
                
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="bg-black/90 backdrop-blur-xl border-white/10 shadow-xl rounded-xl p-1 min-w-[220px]" sideOffset={15} alignOffset={0}>
                  {modelsForProvider.map(model => <DropdownMenuItem key={model.id} className={`gap-2 px-3 py-2 flex flex-col items-start rounded-lg mx-1 my-0.5 cursor-pointer
                                ${selectedModel === model.id ? 'bg-white/10' : 'hover:bg-white/5'}`} onClick={() => onChange(model.id)}>
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium text-white">{model.displayName}</span>
                        {model.modes.map(modelMode => <span key={modelMode} className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                            {modelMode}
                          </span>)}
                      </div>
                      <p className="text-xs text-white/60 w-full">
                        {model.description}
                      </p>
                    </DropdownMenuItem>)}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>;
      })}
        
        <DropdownMenuItem className="flex items-center justify-between gap-2 px-3 py-2 mt-1 text-sm text-white hover:bg-white/5 rounded-lg mx-1 my-0.5 cursor-pointer">
          <span className="font-medium">Mais modelos</span>
          <ChevronRight className="h-4 w-4 opacity-70" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>;
};

export default ModelSelector;
