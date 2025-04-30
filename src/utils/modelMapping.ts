
type ModelMapping = Record<string, string>;

// Updated mapping for image models based on APIframe.ai documentation
const imageModelMapping: ModelMapping = {
  'sdxl': 'stable-diffusion-xl', 
  'sdxl-turbo': 'stable-diffusion-xl-turbo',
  'kandinsky': 'kandinsky-2.2',
  'deepfloyd': 'deepfloyd-if',
  'dalle-3': 'dall-e-3',
  'midjourney': 'midjourney-v6',
  'sd-3': 'stable-diffusion-3', // Added newer model
  'pixel-art': 'pixel-art-xl',  // Added specialty model
};

// Mapping for video models
const videoModelMapping: ModelMapping = {
  'runway-gen2': 'runway-gen2',
  'kling-text': 'kling-text-to-video',
  'kling-img': 'kling-image-to-video',
  'luma-text': 'luma-text-to-video',
  'luma-img': 'luma-image-to-video',
  'hunyuan-fast': 'hunyuan-txt2video-fast',
  'hunyuan-standard': 'hunyuan-txt2video-standard',
  'hailuo-text': 'hailuo-t2v-01',
  'hailuo-image': 'hailuo-i2v-01',
};

// Mapping for audio models
const audioModelMapping: ModelMapping = {
  'elevenlabs-v2': 'eleven-labs-v2',
  'openai-tts-1': 'openai-tts-1',
  'coqui-xtts': 'coqui-xtts',
  'musicgen': 'meta-musicgen',
  'audiogen': 'meta-audiogen',
};

/**
 * Maps UI model ID to APIframe model ID
 */
export function getApiframeModelId(modelId: string): string {
  // Add logging to debug model mapping
  const mappedId = imageModelMapping[modelId] || 
                   videoModelMapping[modelId] || 
                   audioModelMapping[modelId] || 
                   modelId;
  
  console.log(`[modelMapping] Mapped model ID '${modelId}' to '${mappedId}'`);
  return mappedId;
}

/**
 * Checks if a model ID is supported by APIframe
 */
export function isApiframeModel(modelId: string): boolean {
  return (
    Object.keys(imageModelMapping).includes(modelId) ||
    Object.keys(videoModelMapping).includes(modelId) ||
    Object.keys(audioModelMapping).includes(modelId)
  );
}

/**
 * Gets the media type for a given model ID
 */
export function getMediaTypeForModel(modelId: string): 'image' | 'video' | 'audio' | null {
  if (Object.keys(imageModelMapping).includes(modelId)) {
    return 'image';
  }
  
  if (Object.keys(videoModelMapping).includes(modelId)) {
    return 'video';
  }
  
  if (Object.keys(audioModelMapping).includes(modelId)) {
    return 'audio';
  }
  
  return null;
}

/**
 * Checks if a model requires a reference image
 */
export function modelRequiresReference(modelId: string): boolean {
  // Models that require reference images
  const referenceRequiredModels = [
    'kling-img',
    'luma-img',
    'hailuo-image'
  ];
  
  return referenceRequiredModels.includes(modelId);
}
