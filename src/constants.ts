
export interface ChatModel {
  id: string;
  displayName: string;
  provider: string;
  modes: ('text' | 'image' | 'video' | 'audio' | 'call')[];
  capabilities?: {
    imageGeneration?: boolean;
  };
}

// OpenAI models through OpenRouter
const OPENAI_MODELS: ChatModel[] = [
  {
    id: 'openai/gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    provider: 'openai',
    modes: ['text'],
  },
  {
    id: 'openai/o4-mini-high',
    displayName: 'GPT-4o Mini High',
    provider: 'openai',
    modes: ['text'],
  },
  {
    id: 'openai/gpt-4o',
    displayName: 'GPT-4o',
    provider: 'openai',
    modes: ['text'],
  },
  {
    id: 'openai/o3',
    displayName: 'O3',
    provider: 'openai',
    modes: ['text'],
  }
];

// Anthropic models through OpenRouter
const ANTHROPIC_MODELS: ChatModel[] = [
  {
    id: 'anthropic/claude-3.7-sonnet',
    displayName: 'Claude 3.7 Sonnet',
    provider: 'anthropic',
    modes: ['text'],
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    displayName: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    modes: ['text'],
  }
];

// Google models through OpenRouter
const GOOGLE_MODELS: ChatModel[] = [
  {
    id: 'google/gemini-2.0-flash-001',
    displayName: 'Gemini 2.0 Flash',
    provider: 'google',
    modes: ['text'],
  },
  {
    id: 'google/gemini-2.5-pro-preview-03-25',
    displayName: 'Gemini 2.5 Pro Preview',
    provider: 'google',
    modes: ['text'],
  },
  {
    id: 'google/gemini-2.0-flash-lite-001',
    displayName: 'Gemini 2.0 Flash Lite',
    provider: 'google',
    modes: ['text'],
  }
];

// xAI models through OpenRouter
const XAI_MODELS: ChatModel[] = [
  {
    id: 'x-ai/grok-3-mini-beta',
    displayName: 'Grok 3 Mini Beta',
    provider: 'x-ai',
    modes: ['text'],
  },
  {
    id: 'x-ai/grok-3-beta',
    displayName: 'Grok 3 Beta',
    provider: 'x-ai',
    modes: ['text'],
  },
  {
    id: 'x-ai/grok-beta',
    displayName: 'Grok Beta',
    provider: 'x-ai',
    modes: ['text'],
  }
];

// DeepSeek models through OpenRouter
const DEEPSEEK_MODELS: ChatModel[] = [
  {
    id: 'deepseek/deepseek-chat-v3-0324',
    displayName: 'DeepSeek Chat v3',
    provider: 'deepseek',
    modes: ['text'],
  },
  {
    id: 'deepseek/deepseek-r1',
    displayName: 'DeepSeek R1',
    provider: 'deepseek',
    modes: ['text'],
  },
  {
    id: 'deepseek/deepseek-r1-distill-llama-70b',
    displayName: 'DeepSeek R1 Distill Llama 70B',
    provider: 'deepseek',
    modes: ['text'],
  }
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
    }
  },
  {
    id: 'midjourney',
    displayName: 'Midjourney',
    provider: 'apiframe',
    modes: ['image'],
    capabilities: {
      imageGeneration: true
    }
  }
];

// KlingAI video models through API Frame
const VIDEO_MODELS: ChatModel[] = [
  {
    id: 'kling-text',
    displayName: 'Kling AI (Texto para Vídeo)',
    provider: 'apiframe',
    modes: ['video']
  },
  {
    id: 'kling-image',
    displayName: 'Kling AI (Imagem para Vídeo)',
    provider: 'apiframe',
    modes: ['video']
  }
];

// Suno audio models
const SUNO_AUDIO_MODELS: ChatModel[] = [
  {
    id: 'chirp-v3-0',
    displayName: 'Suno Chirp v3.0 (Básico)',
    provider: 'suno',
    modes: ['audio'],
  },
  {
    id: 'chirp-v3-5',
    displayName: 'Suno Chirp v3.5 (Intermediário)',
    provider: 'suno',
    modes: ['audio'],
  },
  {
    id: 'chirp-v4',
    displayName: 'Suno Chirp v4 (Avançado)',
    provider: 'suno',
    modes: ['audio'],
  }
];

export const AVAILABLE_MODELS: ChatModel[] = [
  {
    id: 'gpt-4o',
    displayName: 'GPT-4o (OpenAI Direct)',
    provider: 'openai',
    modes: ['text', 'image', 'audio', 'call'],
    capabilities: {
      imageGeneration: true
    }
  },
  ...OPENAI_MODELS,
  ...ANTHROPIC_MODELS,
  ...GOOGLE_MODELS,
  ...XAI_MODELS,
  ...DEEPSEEK_MODELS,
  ...IMAGE_MODELS,
  ...VIDEO_MODELS,
  ...SUNO_AUDIO_MODELS
];
