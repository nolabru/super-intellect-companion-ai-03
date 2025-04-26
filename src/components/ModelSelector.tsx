import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, ChevronRight } from 'lucide-react';

export type ModelProvider = 'openai' | 'apiframe' | 'anthropic' | 'google' | 'kligin' | 'ideogram' | 'minimax' | 'elevenlabs' | 'luma';
export type ModelMode = 'text' | 'image' | 'audio' | 'video' | 'call';

export interface ModelInfo {
  id: string;
  displayName: string;
  provider: ModelProvider;
  capabilities: string[];
  description: string;
  modes: ModelMode[];
}

export const AVAILABLE_MODELS: ModelInfo[] = [
  // Text Models
  {
    id: 'gpt-4o',
    displayName: 'GPT-4o',
    provider: 'openai',
    capabilities: ['Raciocínio avançado', 'Análise de imagens', 'Conhecimento atualizado até Apr 2023'],
    description: 'Modelo mais poderoso da OpenAI, com excelente raciocínio e análise de imagens.',
    modes: ['text']
  },
  
  // Image Models
  {
    id: 'apiframe-sdxl',
    displayName: 'Stable Diffusion XL',
    provider: 'apiframe',
    capabilities: ['Alta qualidade', 'Imagens detalhadas', 'Controle avançado'],
    description: 'Modelo premium de geração de imagens com qualidade excepcional.',
    modes: ['image']
  },
  {
    id: 'apiframe-kandinsky',
    displayName: 'Kandinsky',
    provider: 'apiframe',
    capabilities: ['Estilo artístico', 'Composições criativas', 'Cores vibrantes'],
    description: 'Gerador de imagens com foco em criatividade e estilo artístico.',
    modes: ['image']
  },
  {
    id: 'apiframe-deepfloyd',
    displayName: 'DeepFloyd',
    provider: 'apiframe',
    capabilities: ['Realismo', 'Detalhes precisos', 'Texturas complexas'],
    description: 'Modelo especializado em imagens realistas e detalhadas.',
    modes: ['image']
  },
  {
    id: 'apiframe-dalle',
    displayName: 'DALL-E 3',
    provider: 'apiframe',
    capabilities: ['Compreensão avançada', 'Alta fidelidade', 'Seguir instruções detalhadas'],
    description: 'Gerador de imagens da OpenAI com excelente interpretação de prompts.',
    modes: ['image']
  },
  {
    id: 'apiframe-sdxl-turbo',
    displayName: 'SDXL Turbo',
    provider: 'apiframe',
    capabilities: ['Geração rápida', 'Qualidade decente', 'Baixa latência'],
    description: 'Versão otimizada do SDXL para geração rápida de imagens.',
    modes: ['image']
  },
  
  // Video Models
  {
    id: 'apiframe-kling-text',
    displayName: 'Kling Text-to-Video',
    provider: 'apiframe',
    capabilities: ['Texto para vídeo', 'Animações fluidas', 'Qualidade HD'],
    description: 'Gerador de vídeos a partir de descrições textuais.',
    modes: ['video']
  },
  {
    id: 'apiframe-kling-image',
    displayName: 'Kling Image-to-Video',
    provider: 'apiframe',
    capabilities: ['Imagem para vídeo', 'Animações realistas', 'Controle de movimento'],
    description: 'Transforma imagens estáticas em vídeos animados.',
    modes: ['video']
  },
  {
    id: 'apiframe-hunyuan-fast',
    displayName: 'HunYuan Fast',
    provider: 'apiframe',
    capabilities: ['Geração rápida', 'Vídeos curtos', 'Baixa latência'],
    description: 'Modelo otimizado para geração rápida de vídeos.',
    modes: ['video']
  },
  {
    id: 'apiframe-hunyuan-standard',
    displayName: 'HunYuan Standard',
    provider: 'apiframe',
    capabilities: ['Alta qualidade', 'Vídeos longos', 'Controle detalhado'],
    description: 'Modelo padrão para geração de vídeos de alta qualidade.',
    modes: ['video']
  },
  {
    id: 'apiframe-hailuo-text',
    displayName: 'Hailuo Text-to-Video',
    provider: 'apiframe',
    capabilities: ['Texto para vídeo', 'Efeitos especiais', 'Transições suaves'],
    description: 'Especializado em criar vídeos com efeitos visuais a partir de texto.',
    modes: ['video']
  },
  {
    id: 'apiframe-hailuo-image',
    displayName: 'Hailuo Image-to-Video',
    provider: 'apiframe',
    capabilities: ['Imagem para vídeo', 'Animações artísticas', 'Estilos variados'],
    description: 'Transforma imagens em vídeos com estilos artísticos.',
    modes: ['video']
  },
  
  // Audio Models
  {
    id: 'apiframe-elevenlabs-v2',
    displayName: 'ElevenLabs V2',
    provider: 'apiframe',
    capabilities: ['Vozes naturais', 'Múltiplos idiomas', 'Controle de emoção'],
    description: 'Modelo avançado de síntese de voz com suporte multilíngue.',
    modes: ['audio']
  },
  {
    id: 'apiframe-openai-tts-1',
    displayName: 'OpenAI TTS-1',
    provider: 'apiframe',
    capabilities: ['Voz realista', 'Alta qualidade', 'Rápida geração'],
    description: 'Modelo de conversão de texto em fala da OpenAI.',
    modes: ['audio']
  },
  {
    id: 'apiframe-coqui-xtts',
    displayName: 'Coqui XTTS',
    provider: 'apiframe',
    capabilities: ['Clonagem de voz', 'Multilíngue', 'Personalização avançada'],
    description: 'Modelo especializado em clonagem e personalização de voz.',
    modes: ['audio']
  },
  
  // Call Models
  {
    id: 'openai-voice-chat',
    displayName: 'OpenAI Voice Chat',
    provider: 'openai',
    capabilities: ['Chamadas de voz', 'Conversação natural', 'Tempo real'],
    description: 'Modelo para chamadas de voz interativas com IA em tempo real.',
    modes: ['call']
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

export const getProviderDisplayName = (provider: ModelProvider): string => {
  switch (provider) {
    case 'openai':
      return 'OpenAI';
    case 'apiframe':
      return 'APIframe';
    case 'anthropic':
      return 'Anthropic';
    case 'google':
      return 'Google';
    case 'kligin':
      return 'Kligin';
    case 'ideogram':
      return 'Ideogram';
    case 'minimax':
      return 'MiniMax';
    case 'elevenlabs':
      return 'ElevenLabs';
    case 'luma':
      return 'Luma AI';
    default:
      return provider;
  }
};

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
      case 'apiframe':
        return '📍';
      case 'anthropic':
        return '🔮';
      case 'google':
        return '🤖';
      case 'kligin':
        return '🔑';
      case 'ideogram':
        return '📚';
      case 'minimax':
        return '🧠';
      case 'elevenlabs':
        return '🗣️';
      case 'luma':
        return '🎨';
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
