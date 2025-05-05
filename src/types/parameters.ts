
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

export type GenerationParameters = ImageParameters | VideoParameters | AudioParameters;

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
        style: 'default', // Alterado de 'cinematic' para 'default' (valor compatível)
        duration: 5, // Mantido como 5 segundos para compatibilidade com a API Kling
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
    default:
      return {};
  }
};
