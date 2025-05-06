
export interface ChatModel {
  id: string;
  displayName: string;
  provider: string;
  modes: ('text' | 'image' | 'video' | 'audio' | 'call')[];
  capabilities?: {
    imageGeneration?: boolean;
  };
}

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
    displayName: 'GPT-4o',
    provider: 'openai',
    modes: ['text', 'image', 'audio', 'call'],
    capabilities: {
      imageGeneration: true
    }
  },
  ...IMAGE_MODELS,
  ...VIDEO_MODELS,
  ...SUNO_AUDIO_MODELS
];
