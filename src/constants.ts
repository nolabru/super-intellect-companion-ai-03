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
  // Video model removed from here
  // Add all image models (both Ideogram and Midjourney) 
  ...IMAGE_MODELS,
  // Keep audio models
  ...APIFRAME_AUDIO_MODELS
];
