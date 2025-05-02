
export interface ChatModel {
  id: string;
  displayName: string;
  provider: string;
  modes: ('text' | 'image' | 'video' | 'audio' | 'call')[];
  capabilities?: {
    imageGeneration?: boolean;
  };
}

// APIframe models based on modelMapping.ts
// Image models
const APIFRAME_IMAGE_MODELS: ChatModel[] = [
  {
    id: 'sdxl',
    displayName: 'Stable Diffusion XL',
    provider: 'apiframe',
    modes: ['image'],
  },
  {
    id: 'sdxl-turbo',
    displayName: 'SDXL Turbo (Fast)',
    provider: 'apiframe',
    modes: ['image'],
  },
  {
    id: 'kandinsky',
    displayName: 'Kandinsky 2.2',
    provider: 'apiframe',
    modes: ['image'],
  },
  {
    id: 'deepfloyd',
    displayName: 'DeepFloyd IF',
    provider: 'apiframe',
    modes: ['image'],
  },
  {
    id: 'dalle-3',
    displayName: 'DALL-E 3',
    provider: 'apiframe',
    modes: ['image'],
  },
  {
    id: 'midjourney',
    displayName: 'Midjourney',
    provider: 'apiframe',
    modes: ['image'],
  }
];

// Video models
const APIFRAME_VIDEO_MODELS: ChatModel[] = [
  {
    id: 'runway-gen2',
    displayName: 'Runway Gen-2',
    provider: 'apiframe',
    modes: ['video'],
  },
  {
    id: 'kling-text',
    displayName: 'Kling Text-to-Video',
    provider: 'apiframe',
    modes: ['video'],
  },
  {
    id: 'kling-img',
    displayName: 'Kling Image-to-Video',
    provider: 'apiframe',
    modes: ['video'],
  },
  {
    id: 'luma-text',
    displayName: 'Luma Text-to-Video',
    provider: 'apiframe',
    modes: ['video'],
  },
  {
    id: 'luma-img',
    displayName: 'Luma Image-to-Video',
    provider: 'apiframe',
    modes: ['video'],
  },
  {
    id: 'hunyuan-fast',
    displayName: 'Hunyuan Fast',
    provider: 'apiframe',
    modes: ['video'],
  },
  {
    id: 'hunyuan-standard',
    displayName: 'Hunyuan Standard',
    provider: 'apiframe',
    modes: ['video'],
  },
  {
    id: 'hailuo-text',
    displayName: 'Hailuo Text-to-Video',
    provider: 'apiframe',
    modes: ['video'],
  },
  {
    id: 'hailuo-image',
    displayName: 'Hailuo Image-to-Video',
    provider: 'apiframe',
    modes: ['video'],
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
  {
    id: 'luma-video',
    displayName: 'Luma AI',
    provider: 'luma',
    modes: ['video'],
  },
  // Add APIframe models
  ...APIFRAME_IMAGE_MODELS,
  ...APIFRAME_VIDEO_MODELS,
  ...APIFRAME_AUDIO_MODELS
];
