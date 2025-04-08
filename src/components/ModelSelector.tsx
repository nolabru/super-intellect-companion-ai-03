
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ChatMode } from './ModeSelector';

// Define a interface para cada modelo
export interface ModelOption {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'kligin' | 'ideogram' | 'minimax' | 'elevenlabs';
  modes: ChatMode[];
}

// Definir todos os modelos disponíveis com seus respectivos provedores
export const AVAILABLE_MODELS: ModelOption[] = [
  // Modelos de texto
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', modes: ['text'] },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic', modes: ['text'] },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'anthropic', modes: ['text'] },
  { id: 'llama-3', name: 'Llama 3', provider: 'google', modes: ['text'] },
  
  // Modelos de imagem
  { id: 'gpt-4o-vision', name: 'GPT-4o Vision', provider: 'openai', modes: ['image'] },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic', modes: ['image'] },
  { id: 'gemini-pro-vision', name: 'Gemini Pro Vision', provider: 'google', modes: ['image'] },
  { id: 'kligin-image', name: 'Kligin AI', provider: 'kligin', modes: ['image'] },
  { id: 'ideogram', name: 'Ideogram', provider: 'ideogram', modes: ['image'] },
  
  // Modelos de vídeo
  { id: 'gpt-4o-vision', name: 'GPT-4o Vision', provider: 'openai', modes: ['video'] },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic', modes: ['video'] },
  { id: 'kligin-video', name: 'Kligin AI', provider: 'kligin', modes: ['video'] },
  { id: 'minimax-video', name: 'Minimax', provider: 'minimax', modes: ['video'] },
  
  // Modelos de áudio
  { id: 'whisper-large-v3', name: 'Whisper Large v3', provider: 'openai', modes: ['audio'] },
  { id: 'deepgram-nova-2', name: 'Deepgram Nova 2', provider: 'openai', modes: ['audio'] },
  { id: 'eleven-labs', name: 'ElevenLabs', provider: 'elevenlabs', modes: ['audio'] }
];

// Função para obter modelos disponíveis por modo
export function getModelsByMode(mode: ChatMode): ModelOption[] {
  return AVAILABLE_MODELS.filter(model => model.modes.includes(mode));
}

interface ModelSelectorProps {
  mode?: ChatMode;
  selectedModel: string;
  onChange: (model: string) => void;
  className?: string;
  disabled?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  mode = 'text', 
  selectedModel, 
  onChange,
  className,
  disabled = false
}) => {
  // Get available models for the current mode
  const availableModels = getModelsByMode(mode);
  
  // If current selected model is not available for this mode, default to first option
  React.useEffect(() => {
    if (!availableModels.find(model => model.id === selectedModel)) {
      onChange(availableModels[0]?.id || '');
    }
  }, [mode, selectedModel, onChange, availableModels]);

  return (
    <Select value={selectedModel} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent>
        {availableModels.map(model => (
          <SelectItem key={model.id} value={model.id}>
            {model.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ModelSelector;
