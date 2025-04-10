
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ChatMode } from './ModeSelector';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu';
import { Check, ChevronRight } from 'lucide-react';

// Define a interface para cada modelo
export interface ModelOption {
  id: string;
  name: string;
  displayName: string; // Nome simplificado para exibição
  provider: 'openai' | 'anthropic' | 'google' | 'kligin' | 'ideogram' | 'minimax' | 'elevenlabs' | 'luma';
  modes: ChatMode[];
  canGenerateImages?: boolean; // Campo para indicar se o modelo pode gerar imagens
  canGenerateAudio?: boolean; // Novo campo para indicar se o modelo pode gerar áudio
  description?: string; // Descrição do modelo para mostrar no dropdown
}

// Definir todos os modelos disponíveis com seus respectivos provedores
export const AVAILABLE_MODELS: ModelOption[] = [
  // Modelos de texto
  { 
    id: 'gpt-4o', 
    name: 'GPT-4o', 
    displayName: 'GPT-4o', 
    provider: 'openai', 
    modes: ['text'],
    description: 'Modelo avançado com capacidade multimodal'
  },
  { 
    id: 'gpt-4o-mini', 
    name: 'GPT-4o Mini', 
    displayName: 'GPT-4o Mini', 
    provider: 'openai', 
    modes: ['text'],
    description: 'Mais rápido para a maioria das perguntas'
  },
  { 
    id: 'gpt-4-turbo', 
    name: 'GPT-4 Turbo', 
    displayName: 'GPT-4 Turbo', 
    provider: 'openai', 
    modes: ['text'],
    description: 'Rápido e eficiente para tarefas complexas'
  },
  { 
    id: 'claude-3-opus', 
    name: 'Claude 3 Opus', 
    displayName: 'Claude 3 Opus', 
    provider: 'anthropic', 
    modes: ['text'],
    description: 'O mais poderoso para raciocínio complexo'
  },
  { 
    id: 'claude-3-sonnet', 
    name: 'Claude 3 Sonnet', 
    displayName: 'Claude 3 Sonnet', 
    provider: 'anthropic', 
    modes: ['text'],
    description: 'Balanceado entre velocidade e capacidade'
  },
  { 
    id: 'claude-3-haiku', 
    name: 'Claude 3 Haiku', 
    displayName: 'Claude 3 Haiku', 
    provider: 'anthropic', 
    modes: ['text'],
    description: 'Rápido e econômico para interações simples'
  },
  { 
    id: 'gemini-pro', 
    name: 'Gemini Pro', 
    displayName: 'Gemini Pro', 
    provider: 'google', 
    modes: ['text'],
    description: 'Modelo de linguagem avançado do Google'
  },
  { 
    id: 'gemini-1.5-pro', 
    name: 'Gemini 1.5 Pro', 
    displayName: 'Gemini 1.5 Pro', 
    provider: 'google', 
    modes: ['text'],
    description: 'Capacidade multimodal avançada'
  },
  { 
    id: 'llama-3', 
    name: 'Llama 3', 
    displayName: 'Llama 3', 
    provider: 'google', 
    modes: ['text'],
    description: 'Modelo open source de alto desempenho'
  },
  
  // Modelos de imagem
  { 
    id: 'gpt-4o', 
    name: 'GPT-4o (DALL-E)', 
    displayName: 'DALL-E 3', 
    provider: 'openai', 
    modes: ['image'], 
    canGenerateImages: true,
    description: 'Geração de imagens de alta qualidade'
  },
  { 
    id: 'gpt-4o-vision', 
    name: 'GPT-4o Vision', 
    displayName: 'GPT-4o Vision', 
    provider: 'openai', 
    modes: ['image'],
    description: 'Análise avançada de imagens'
  },
  { 
    id: 'claude-3-opus', 
    name: 'Claude 3 Opus', 
    displayName: 'Claude 3 Opus', 
    provider: 'anthropic', 
    modes: ['image'],
    description: 'Compreensão detalhada de imagens'
  },
  { 
    id: 'claude-3-sonnet', 
    name: 'Claude 3 Sonnet', 
    displayName: 'Claude 3 Sonnet', 
    provider: 'anthropic', 
    modes: ['image'],
    description: 'Balanceado para análise de imagens'
  },
  { 
    id: 'gemini-pro-vision', 
    name: 'Gemini Pro Vision', 
    displayName: 'Gemini Pro Vision', 
    provider: 'google', 
    modes: ['image'],
    description: 'Capacidade visual avançada do Google'
  },
  { 
    id: 'kligin-image', 
    name: 'Kligin AI', 
    displayName: 'Kligin AI', 
    provider: 'kligin', 
    modes: ['image'],
    description: 'Especializado em processamento de imagens'
  },
  { 
    id: 'ideogram', 
    name: 'Ideogram', 
    displayName: 'Ideogram', 
    provider: 'ideogram', 
    modes: ['image'],
    description: 'Geração criativa de imagens e arte'
  },
  { 
    id: 'luma-image', 
    name: 'Luma AI', 
    displayName: 'Luma AI', 
    provider: 'luma', 
    modes: ['image'],
    description: 'Especializado em imagens realistas'
  },
  
  // Modelos de vídeo
  { 
    id: 'gpt-4o-vision', 
    name: 'GPT-4o Vision', 
    displayName: 'GPT-4o Vision', 
    provider: 'openai', 
    modes: ['video'],
    description: 'Compreensão avançada de vídeos'
  },
  { 
    id: 'claude-3-opus', 
    name: 'Claude 3 Opus', 
    displayName: 'Claude 3 Opus', 
    provider: 'anthropic', 
    modes: ['video'],
    description: 'Análise detalhada de conteúdo em vídeo'
  },
  { 
    id: 'claude-3-sonnet', 
    name: 'Claude 3 Sonnet', 
    displayName: 'Claude 3 Sonnet', 
    provider: 'anthropic', 
    modes: ['video'],
    description: 'Compreensão eficiente de vídeos'
  },
  { 
    id: 'kligin-video', 
    name: 'Kligin AI', 
    displayName: 'Kligin AI', 
    provider: 'kligin', 
    modes: ['video'],
    description: 'Especializado em análise de vídeo'
  },
  { 
    id: 'minimax-video', 
    name: 'Minimax', 
    displayName: 'Minimax', 
    provider: 'minimax', 
    modes: ['video'],
    description: 'Processamento eficiente de vídeos'
  },
  { 
    id: 'luma-video', 
    name: 'Luma AI', 
    displayName: 'Luma AI', 
    provider: 'luma', 
    modes: ['video'],
    description: 'Geração avançada de vídeos'
  },
  
  // Modelos de áudio
  { 
    id: 'whisper-large-v3', 
    name: 'Whisper Large v3', 
    displayName: 'Whisper', 
    provider: 'openai', 
    modes: ['audio'],
    description: 'Transcrição de áudio de alta precisão'
  },
  { 
    id: 'deepgram-nova-2', 
    name: 'Deepgram Nova 2', 
    displayName: 'Deepgram', 
    provider: 'openai', 
    modes: ['audio'],
    description: 'Reconhecimento de fala avançado'
  },
  { 
    id: 'eleven-labs', 
    name: 'ElevenLabs', 
    displayName: 'ElevenLabs', 
    provider: 'elevenlabs', 
    modes: ['audio'], 
    canGenerateAudio: true,
    description: 'Síntese de voz realista'
  }
];

// Função para obter modelos disponíveis por modo
export function getModelsByMode(mode: ChatMode): ModelOption[] {
  return AVAILABLE_MODELS.filter(model => model.modes.includes(mode));
}

// Função para agrupar modelos por provedor
export function getModelsByProvider(mode: ChatMode): Record<string, ModelOption[]> {
  const modelsByProvider: Record<string, ModelOption[]> = {};
  
  const models = getModelsByMode(mode);
  
  models.forEach(model => {
    if (!modelsByProvider[model.provider]) {
      modelsByProvider[model.provider] = [];
    }
    modelsByProvider[model.provider].push(model);
  });
  
  return modelsByProvider;
}

// Função para verificar se um modelo pode gerar imagens
export function canModelGenerateImages(modelId: string): boolean {
  const model = AVAILABLE_MODELS.find(m => m.id === modelId);
  return !!model?.canGenerateImages;
}

// Função para verificar se um modelo pode gerar áudio
export function canModelGenerateAudio(modelId: string): boolean {
  const model = AVAILABLE_MODELS.find(m => m.id === modelId);
  return !!model?.canGenerateAudio;
}

// Função para obter o nome amigável do provedor
export function getProviderDisplayName(provider: string): string {
  switch (provider) {
    case 'openai':
      return 'OpenAI';
    case 'anthropic':
      return 'Anthropic';
    case 'google':
      return 'Google AI';
    case 'kligin':
      return 'Kligin AI';
    case 'ideogram':
      return 'Ideogram';
    case 'minimax':
      return 'Minimax';
    case 'elevenlabs':
      return 'ElevenLabs';
    case 'luma':
      return 'Luma AI';
    default:
      return provider.charAt(0).toUpperCase() + provider.slice(1);
  }
}

interface ModelSelectorProps {
  mode?: ChatMode;
  selectedModel: string;
  onChange: (model: string) => void;
  className?: string;
  disabled?: boolean;
}

// Componente de seleção de modelo aprimorado com grupos por provedor
const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  mode = 'text', 
  selectedModel, 
  onChange,
  className,
  disabled = false
}) => {
  // Get available models by provider for the current mode
  const modelsByProvider = getModelsByProvider(mode);
  const availableModels = getModelsByMode(mode);
  
  // Get selected model details
  const selectedModelDetails = AVAILABLE_MODELS.find(model => model.id === selectedModel && model.modes.includes(mode));
  
  // If current selected model is not available for this mode, default to first option
  React.useEffect(() => {
    if (!availableModels.find(model => model.id === selectedModel)) {
      onChange(availableModels[0]?.id || '');
    }
  }, [mode, selectedModel, onChange, availableModels]);

  // Versão com DropdownMenu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button 
          className={`flex items-center justify-between w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background 
                    focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        >
          <span className="flex items-center gap-2">
            <span>{selectedModelDetails?.displayName || 'Selecionar modelo'}</span>
          </span>
          <ChevronRight className="h-4 w-4 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>Modelos disponíveis</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {Object.entries(modelsByProvider).map(([provider, models]) => (
          <DropdownMenuSub key={provider}>
            <DropdownMenuSubTrigger>
              <span>{getProviderDisplayName(provider)}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="w-56">
                {models.map(model => (
                  <DropdownMenuItem 
                    key={`${model.id}-${model.modes.join('-')}`}
                    onSelect={() => onChange(model.id)}
                    className="flex justify-between items-start"
                  >
                    <div className="flex flex-col">
                      <span>{model.displayName}</span>
                      {model.description && (
                        <span className="text-xs text-muted-foreground">{model.description}</span>
                      )}
                      {model.canGenerateImages && mode === 'image' && (
                        <span className="text-xs text-green-500">(gerador)</span>
                      )}
                      {model.canGenerateAudio && mode === 'audio' && (
                        <span className="text-xs text-indigo-400">(text-to-speech)</span>
                      )}
                    </div>
                    {selectedModel === model.id && <Check className="h-4 w-4" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ModelSelector;
