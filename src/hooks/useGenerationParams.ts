
import { useState, useCallback, useMemo, useEffect } from 'react';
import { ChatMode } from '@/components/ModeSelector';
import { 
  GenerationParameters, 
  getDefaultParameters,
  isImageParameters,
  isVideoParameters,
  isAudioParameters
} from '@/types/parameters';

interface UseGenerationParamsOptions {
  mode: ChatMode;
  model: string;
  initialParams?: Partial<GenerationParameters>;
}

export function useGenerationParams({ 
  mode, 
  model, 
  initialParams 
}: UseGenerationParamsOptions) {
  // State for the current parameters
  const [params, setParams] = useState<GenerationParameters>(
    getDefaultParameters(mode, model)
  );

  // Update params when mode or model changes
  useEffect(() => {
    setParams(prev => {
      const defaultParams = getDefaultParameters(mode, model);
      
      // Merge with initialParams if provided
      return initialParams 
        ? { ...defaultParams, ...initialParams }
        : defaultParams;
    });
  }, [mode, model, initialParams]);

  // Memoized update function to prevent unnecessary renders
  const updateParams = useCallback((newParams: Partial<GenerationParameters>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  // Type-safe getter functions
  const getImageParams = useCallback(() => {
    if (isImageParameters(params)) {
      return params;
    }
    return getDefaultParameters('image', model);
  }, [params, model]);

  const getVideoParams = useCallback(() => {
    if (isVideoParameters(params)) {
      return params;
    }
    return getDefaultParameters('video', model);
  }, [params, model]);

  const getAudioParams = useCallback(() => {
    if (isAudioParameters(params)) {
      return params;
    }
    return getDefaultParameters('audio', model);
  }, [params, model]);

  // Get parameters for the current mode
  const currentParams = useMemo(() => {
    switch (mode) {
      case 'image': return getImageParams();
      case 'video': return getVideoParams();
      case 'audio': return getAudioParams();
      default: return { model };
    }
  }, [mode, model, getImageParams, getVideoParams, getAudioParams]);

  return {
    params: currentParams,
    updateParams,
    getImageParams,
    getVideoParams, 
    getAudioParams,
    resetParams: useCallback(() => 
      setParams(getDefaultParameters(mode, model)), 
      [mode, model]
    )
  };
}
