
export interface ChatModel {
  id: string;
  displayName: string;
  provider: string;
  modes: ('text' | 'image' | 'video' | 'audio' | 'call')[];
  capabilities?: {
    imageGeneration?: boolean;
  };
}

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
  }
];

