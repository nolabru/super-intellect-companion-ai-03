
import { apiRequestService } from './api/apiRequestService';
import { mediaStorageService } from './api/mediaStorageService';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook que fornece serviços de API para comunicação com modelos de IA
 */
export function useApiService() {
  const { user } = useAuth();
  
  return {
    sendRequest: (
      content, 
      mode, 
      modelId, 
      files, 
      params, 
      enableStreaming, 
      streamListener, 
      conversationHistory, 
      userId
    ) => apiRequestService.sendRequest(
      content, 
      mode, 
      modelId, 
      files, 
      params, 
      enableStreaming, 
      streamListener, 
      conversationHistory, 
      userId || user?.id
    ),
    storeMedia: mediaStorageService.storeMedia
  };
}
