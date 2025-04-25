
export const getApiframeModelId = (modelId: string): string => {
  // Remove 'apiframe-' prefix if present
  return modelId.startsWith('apiframe-') ? modelId.replace('apiframe-', '') : modelId;
};

export const isApiframeModel = (modelId: string): boolean => {
  return modelId.startsWith('apiframe-');
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

