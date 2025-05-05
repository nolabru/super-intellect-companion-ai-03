
import { MidjourneyParams } from '@/components/chat/parameters/MidjourneyParameters';

export interface ImageParameters {
  style_type?: string;
  aspect_ratio?: string;
  negative_prompt?: string;
  quality?: string;
  style?: string;
  [key: string]: any;
}

export interface VideoParameters {
  style?: string;
  duration?: number;
  fps?: number;
  [key: string]: any;
}

export interface AudioParameters {
  voice_id?: string;
  duration?: number;
  genre?: string;
  [key: string]: any;
}

export interface OpenRouterParameters {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
  [key: string]: any;
}

export type GenerationParameters = ImageParameters | VideoParameters | AudioParameters | OpenRouterParameters;

// Type guard functions
export const isImageParameters = (params: any): params is ImageParameters => {
  return params && (
    params.style_type !== undefined || 
    params.aspect_ratio !== undefined || 
    params.negative_prompt !== undefined ||
    params.quality !== undefined
  );
};

export const isVideoParameters = (params: any): params is VideoParameters => {
  return params && (
    params.videoType !== undefined ||
    params.resolution !== undefined ||
    (params.duration !== undefined && typeof params.duration !== 'string')
  );
};

export const isAudioParameters = (params: any): params is AudioParameters => {
  return params && (
    params.voice_id !== undefined ||
    params.genre !== undefined ||
    params.speed !== undefined ||
    params.pitch !== undefined
  );
};

export const isOpenRouterParameters = (params: any): params is OpenRouterParameters => {
  return params && (
    params.temperature !== undefined ||
    params.max_tokens !== undefined ||
    params.top_p !== undefined
  );
};

// Get default parameters based on mode and model
export const getDefaultParameters = (mode: string, model: string): GenerationParameters => {
  switch (mode) {
    case 'image':
      if (model === 'midjourney') {
        return {
          negative_prompt: '',
          quality: 'standard',
          aspect_ratio: '1:1',
          style: 'raw'
        };
      }
      // Default for Ideogram
      return {
        style_type: 'GENERAL',
        aspect_ratio: 'ASPECT_1_1'
      };
    case 'video':
      return {
        style: 'cinematic',
        duration: 5, // Changed from 3 to 5 (valid Kling API value)
        fps: 24
      };
    case 'audio':
      if (model.includes('elevenlabs')) {
        return {
          voice_id: 'default',
        };
      } else if (model.includes('musicgen') || model.includes('audiogen')) {
        return {
          duration: 10,
          genre: 'ambient'
        };
      }
      return {};
    case 'text':
      if (model.includes('/')) {  // OpenRouter models use a provider/model format
        return {
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
          stream: true
        };
      }
      return {};
    default:
      return {};
  }
};
