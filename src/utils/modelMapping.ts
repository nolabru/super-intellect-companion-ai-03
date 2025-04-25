
export const getApiframeModelId = (modelId: string): string => {
  // Remove 'apiframe-' prefix if present
  return modelId.startsWith('apiframe-') ? modelId.replace('apiframe-', '') : modelId;
};

export const isApiframeModel = (modelId: string): boolean => {
  return modelId.startsWith('apiframe-');
};
