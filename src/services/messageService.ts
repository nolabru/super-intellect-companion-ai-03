
import { MessageType } from '@/components/ChatMessage';
import { ChatMode } from '@/components/ModeSelector';
import { LumaParams } from '@/components/LumaParamsButton';
import { useApiService } from '@/hooks/useApiService';
import { useMediaGallery } from '@/hooks/useMediaGallery';
import { ConversationType } from '@/types/conversation';
import { handleSingleModelMessage } from './message/singleModelHandler';
import { handleCompareModels } from './message/compareModelsHandler';

/**
 * Factory function para criar serviço de mensagens
 */
export const createMessageService = (
  apiService: ReturnType<typeof useApiService>,
  mediaGallery: ReturnType<typeof useMediaGallery>,
  setMessages: React.Dispatch<React.SetStateAction<MessageType[]>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
) => {
  // Wrapper para o handler de modelo único
  const handleSingleModel = async (
    content: string,
    mode: ChatMode,
    modelId: string,
    conversationId: string,
    messages: MessageType[],
    conversations: ConversationType[],
    files?: string[],
    params?: LumaParams,
    conversationHistory?: string,
    userId?: string,
    metadata?: Record<string, string>
  ) => {
    return handleSingleModelMessage(
      content,
      mode,
      modelId,
      conversationId,
      messages,
      conversations,
      files,
      params,
      conversationHistory,
      userId,
      setMessages,
      apiService.sendRequest,
      mediaGallery.saveMediaToGallery,
      metadata
    );
  };
  
  // Wrapper para o handler de comparação de modelos
  const handleCompareModelMessages = async (
    content: string,
    mode: ChatMode,
    leftModelId: string,
    rightModelId: string,
    conversationId: string,
    files?: string[],
    params?: LumaParams,
    conversationHistory?: string,
    userId?: string
  ) => {
    return handleCompareModels(
      content,
      mode,
      leftModelId,
      rightModelId,
      conversationId,
      files,
      params,
      conversationHistory,
      userId,
      setMessages,
      apiService.sendRequest,
      mediaGallery.saveMediaToGallery
    );
  };
  
  return {
    handleSingleModelMessage: handleSingleModel,
    handleCompareModels: handleCompareModelMessages
  };
};
