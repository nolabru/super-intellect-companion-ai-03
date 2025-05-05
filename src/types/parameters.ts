
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
        duration: 3,
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
