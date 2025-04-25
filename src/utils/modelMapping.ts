
import { ApiframeModel } from "@/types/apiframeGeneration";

export const getApiframeModelId = (modelId: string): ApiframeModel => {
  // Remove 'apiframe-' prefix if present and convert to valid ApiframeModel type
  const baseId = modelId.startsWith('apiframe-') ? modelId.replace('apiframe-', '') : modelId;
  
  // Type assertion to ApiframeModel since we already validate in isApiframeModel
  return baseId as ApiframeModel;
};

export const isApiframeModel = (modelId: string): boolean => {
  if (!modelId.startsWith('apiframe-')) return false;
  
  const baseId = modelId.replace('apiframe-', '');
  
  // Image models
  const imageModels = ['sdxl', 'kandinsky', 'deepfloyd', 'dalle', 'sdxl-turbo'];
  // Video models
  const videoModels = ['kling-text', 'kling-image', 'hunyuan-fast', 'hunyuan-standard', 'hailuo-text', 'hailuo-image'];
  // Audio models
  const audioModels = ['elevenlabs-v2', 'openai-tts-1', 'coqui-xtts'];
  
  return [...imageModels, ...videoModels, ...audioModels].includes(baseId);
};

export const getModelType = (modelId: string): 'image' | 'video' | 'audio' | null => {
  const baseId = getApiframeModelId(modelId);
  
  // Image models
  if (['sdxl', 'kandinsky', 'deepfloyd', 'dalle', 'sdxl-turbo'].includes(baseId)) {
    return 'image';
  }
  
  // Video models
  if (['kling-text', 'kling-image', 'hunyuan-fast', 'hunyuan-standard', 'hailuo-text', 'hailuo-image'].includes(baseId)) {
    return 'video';
  }
  
  // Audio models
  if (['elevenlabs-v2', 'openai-tts-1', 'coqui-xtts'].includes(baseId)) {
    return 'audio';
  }
  
  return null;
};
