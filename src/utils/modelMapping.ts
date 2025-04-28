
type ModelMapping = Record<string, string>;

const imageModelMapping: ModelMapping = {
  'model-sd-xl': 'stability-sd-xl',
  'model-dalle-3': 'openai-dalle-3',
  'model-midjourney': 'midjourney',
};

const videoModelMapping: ModelMapping = {
  'model-gen2': 'runway-gen2',
  'model-pika-1': 'pika-1',
  'model-luma-3d': 'luma-3d',
};

const audioModelMapping: ModelMapping = {
  'model-eleven': 'eleven-labs',
  'model-openai-tts': 'openai-tts',
  'model-musicgen': 'music-gen',
};

export function getApiframeModelId(modelId: string): string {
  return (
    imageModelMapping[modelId] || 
    videoModelMapping[modelId] || 
    audioModelMapping[modelId] || 
    modelId
  );
}

export function isApiframeModel(modelId: string): boolean {
  return (
    Object.keys(imageModelMapping).includes(modelId) ||
    Object.keys(videoModelMapping).includes(modelId) ||
    Object.keys(audioModelMapping).includes(modelId)
  );
}
