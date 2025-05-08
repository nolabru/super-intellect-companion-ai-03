
import { apiRequestService } from './api/apiRequestService';
import { mediaStorageService } from './api/mediaStorageService';
import { useAuth } from '@/contexts/AuthContext';
import { ChatMode } from '@/components/ModeSelector';

/**
 * Interface para resposta da API
 */
export interface ApiResponse {
  content: string;
  files?: string[];
  error?: string;
  tokenInfo?: {
    tokensUsed: number;
    tokensRemaining: number;
  };
  modeSwitch?: {
    newMode: string;
    newModel: string;
  };
  googleResult?: {
    success: boolean;
    data?: any;
    error?: string;
  };
}

/**
 * Hook que fornece serviços de API para comunicação com modelos de IA
 */
export function useApiService() {
  const { user } = useAuth();
  
  return {
    sendRequest: (
      content: string, 
      mode: ChatMode, 
      modelId: string, 
      files?: string[], 
      params?: any, 
      enableStreaming?: boolean, 
      streamListener?: (chunk: string) => void, 
      conversationHistory?: string, 
      userId?: string
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
