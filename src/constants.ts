export interface ChatModel {
  id: string;
  displayName: string;
  provider: string;
  modes: ('text' | 'image' | 'video' | 'audio' | 'call')[];
  capabilities?: {
    imageGeneration?: boolean;
  };
  description?: string;
}

// OpenRouter text models grouped by provider
const OPENAI_MODELS: ChatModel[] = [
  {
    id: 'openai/gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    provider: 'openai',
    modes: ['text'],
    description: 'Modelo compacto da série GPT-4o'
  },
  {
    id: 'openai/o4-mini-high',
    displayName: 'O4 Mini High',
    provider: 'openai',
    modes: ['text'],
    description: 'Versão otimizada do GPT-4o Mini'
  },
  {
    id: 'openai/gpt-4o',
    displayName: 'GPT-4o',
    provider: 'openai',
    modes: ['text'],
    description: 'Modelo avançado multimodal da OpenAI'
  },
  {
    id: 'openai/o3',
    displayName: 'O3',
    provider: 'openai',
    modes: ['text'],
    description: 'Modelo compacto da OpenAI'
  }
];

const ANTHROPIC_MODELS: ChatModel[] = [
  {
    id: 'anthropic/claude-3-7-sonnet',
    displayName: 'Claude 3.7 Sonnet',
    provider: 'anthropic',
    modes: ['text'],
    description: 'Modelo avançado da Anthropic'
  },
  {
    id: 'anthropic/claude-3-5-sonnet',
    displayName: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    modes: ['text'],
    description: 'Modelo equilibrado da Anthropic'
  }
];

const GOOGLE_MODELS: ChatModel[] = [
  {
    id: 'google/gemini-2-0-flash',
    displayName: 'Gemini 2.0 Flash',
    provider: 'google',
    modes: ['text'],
    description: 'Modelo rápido do Google'
  },
  {
    id: 'google/gemini-2-5-pro-preview',
    displayName: 'Gemini 2.5 Pro Preview',
    provider: 'google',
    modes: ['text'],
    description: 'Versão prévia do Gemini 2.5 Pro'
  },
  {
    id: 'google/gemini-2-0-flash-lite',
    displayName: 'Gemini 2.0 Flash Lite',
    provider: 'google',
    modes: ['text'],
    description: 'Versão leve do Gemini 2.0 Flash'
  }
];

const XAI_MODELS: ChatModel[] = [
  {
    id: 'xai/grok-3-mini-beta',
    displayName: 'Grok 3 Mini Beta',
    provider: 'xai',
    modes: ['text'],
    description: 'Versão compacta do Grok 3'
  },
  {
    id: 'xai/grok-3-beta',
    displayName: 'Grok 3 Beta',
    provider: 'xai',
    modes: ['text'],
    description: 'Modelo principal da xAI em beta'
  },
  {
    id: 'xai/grok-beta',
    displayName: 'Grok Beta',
    provider: 'xai',
    modes: ['text'],
    description: 'Primeira versão do Grok'
  }
];

const DEEPSEEK_MODELS: ChatModel[] = [
  {
    id: 'deepseek/deepseek-chat-v3',
    displayName: 'DeepSeek Chat v3',
    provider: 'deepseek',
    modes: ['text'],
    description: 'Modelo de chat da DeepSeek'
  },
  {
    id: 'deepseek/deepseek-r1',
    displayName: 'DeepSeek R1',
    provider: 'deepseek',
    modes: ['text'],
    description: 'Modelo principal da DeepSeek'
  },
  {
    id: 'deepseek/deepseek-r1-distill',
    displayName: 'DeepSeek R1 Distill',
    provider: 'deepseek',
    modes: ['text'],
    description: 'Versão destilada do DeepSeek R1'
  }
];

// Combine all OpenRouter models
const OPENROUTER_MODELS: ChatModel[] = [
  ...OPENAI_MODELS,
  ...ANTHROPIC_MODELS,
  ...GOOGLE_MODELS,
  ...XAI_MODELS,
  ...DEEPSEEK_MODELS
];

// Combine Ideogram and Midjourney models into a single IMAGE_MODELS group
// All under the apiframe provider
const IMAGE_MODELS: ChatModel[] = [
  {
    id: 'ideogram-v2',
    displayName: 'Ideogram V2',
    provider: 'apiframe',
    modes: ['image'],
    capabilities: {
      imageGeneration: true
    },
    description: 'High quality AI image generation'
  },
  {
    id: 'midjourney',
    displayName: 'Midjourney',
    provider: 'apiframe',
    modes: ['image'],
    capabilities: {
      imageGeneration: true
    },
    description: 'Artistic AI image generation'
  }
];

// Video models from Kling AI via APIFRAME
const VIDEO_MODELS: ChatModel[] = [
  {
    id: 'kling-text',
    displayName: 'Kling Text-to-Video',
    provider: 'apiframe',
    modes: ['video']
  },
  {
    id: 'kling-image',
    displayName: 'Kling Image-to-Video',
    provider: 'apiframe',
    modes: ['video']
  }
];

// Audio models
const APIFRAME_AUDIO_MODELS: ChatModel[] = [
  {
    id: 'elevenlabs-v2',
    displayName: 'ElevenLabs v2',
    provider: 'apiframe',
    modes: ['audio'],
  },
  {
    id: 'openai-tts-1',
    displayName: 'OpenAI TTS-1',
    provider: 'apiframe',
    modes: ['audio'],
  },
  {
    id: 'coqui-xtts',
    displayName: 'Coqui XTTS',
    provider: 'apiframe',
    modes: ['audio'],
  },
  {
    id: 'musicgen',
    displayName: 'Meta MusicGen',
    provider: 'apiframe',
    modes: ['audio'],
  },
  {
    id: 'audiogen',
    displayName: 'Meta AudioGen',
    provider: 'apiframe',
    modes: ['audio'],
  }
];

export const AVAILABLE_MODELS: ChatModel[] = [
  {
    id: 'gpt-4o',
    displayName: 'GPT-4o',
    provider: 'openai',
    modes: ['text', 'image', 'audio', 'call'],
    capabilities: {
      imageGeneration: true
    }
  },
  {
    id: 'claude-3-opus',
    displayName: 'Claude 3 Opus',
    provider: 'anthropic',
    modes: ['text', 'image'],
    capabilities: {
      imageGeneration: false
    }
  },
  {
    id: 'gemini-pro',
    displayName: 'Gemini Pro',
    provider: 'google',
    modes: ['text', 'image'],
    capabilities: {
      imageGeneration: false
    }
  },
  // Add image models explicitly to the top level
  ...IMAGE_MODELS,
  // Add video models
  ...VIDEO_MODELS,
  // Keep audio models
  ...APIFRAME_AUDIO_MODELS,
  // Add OpenRouter models as a separate category
  ...OPENROUTER_MODELS
];

// Export OpenRouter models grouped by provider for easier access
export const OPENROUTER_MODELS_BY_PROVIDER = {
  openai: OPENAI_MODELS,
  anthropic: ANTHROPIC_MODELS,
  google: GOOGLE_MODELS,
  xai: XAI_MODELS,
  deepseek: DEEPSEEK_MODELS
};
