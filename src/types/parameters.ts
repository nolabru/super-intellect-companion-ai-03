
import { ChatMode } from '@/components/ModeSelector';

// Base parameter interface
export interface BaseParameters {
  model: string;
}

// Image generation parameters
export interface ImageParameters extends BaseParameters {
  style?: string;
  aspectRatio?: string;
  quality?: 'standard' | 'hd';
  negativePrompt?: string;
}

// Video generation parameters
export interface VideoParameters extends BaseParameters {
  videoType?: 'text-to-video' | 'image-to-video';
  resolution?: '540p' | '720p' | '1080p' | '4k';
  duration?: '3s' | '5s' | '8s' | '10s';
  quality?: 'standard' | 'hd';
}

// Audio generation parameters
export interface AudioParameters extends BaseParameters {
  voice?: string;
  speed?: number;
  pitch?: number;
}

// Union type for all parameter types
export type GenerationParameters = 
  | ImageParameters 
  | VideoParameters 
  | AudioParameters;

// Helper function to get default parameters based on mode
export const getDefaultParameters = (mode: ChatMode, model: string): GenerationParameters => {
  switch (mode) {
    case 'image':
      return {
        model,
        style: 'photographic',
        aspectRatio: '1:1',
      };
    case 'video':
      return {
        model,
        videoType: 'text-to-video',
        resolution: '720p',
        duration: '5s',
      };
    case 'audio':
      return {
        model,
        voice: 'sarah',
        speed: 1,
        pitch: 1,
      };
    default:
      return { model };
  }
};

// Type guard functions to check parameter types
export const isImageParameters = (params: GenerationParameters): params is ImageParameters => {
  return 'style' in params || 'aspectRatio' in params;
};

export const isVideoParameters = (params: GenerationParameters): params is VideoParameters => {
  return 'videoType' in params || 'duration' in params;
};

export const isAudioParameters = (params: GenerationParameters): params is AudioParameters => {
  return 'voice' in params || 'speed' in params;
};
