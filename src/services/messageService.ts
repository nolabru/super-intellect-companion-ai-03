
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
    skipUserMessage: boolean = false // Parâmetro para controlar se deve criar a mensagem do usuário
  ) => {
    // Create user message with specific model target in compare mode - only if not skipped
    if (!skipUserMessage) {
      const userMessage: MessageType = {
        id: `user-${Date.now()}`,
        content,
        sender: 'user',
        timestamp: new Date().toISOString(),
        mode,
        files,
        model: modelId // Set specific model for user message in compare mode
      };
      
      setMessages(prev => [...prev, userMessage]);
    }

    // Melhorar preparação do histórico de conversa para manter contexto
    // Se não for fornecido externamente, preparar a partir das mensagens atuais
    const enhancedHistory = conversationHistory || prepareConversationHistory(messages);
    console.log(`[messageService] Enviando mensagem para ${modelId} com contexto de ${enhancedHistory.length} caracteres`);

    return handleSingleModelMessage(
      content,
      mode,
      modelId,
      conversationId,
      messages,
      conversations,
      files,
      params,
      enhancedHistory, // Usar o histórico aprimorado
      userId,
      setMessages,
      apiService.sendRequest,
      mediaGallery.saveMediaToGallery,
      skipUserMessage
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
    // Melhorar preparação do histórico de conversa para manter contexto
    // Se não for fornecido externamente, preparar a partir das mensagens atuais
    const enhancedHistory = conversationHistory || prepareConversationHistory(messages);
    console.log(`[messageService] Enviando mensagem para comparação ${leftModelId} vs ${rightModelId} com contexto de ${enhancedHistory.length} caracteres`);

    return handleCompareModels(
      content,
      mode,
      leftModelId,
      rightModelId,
      conversationId,
      files,
      params,
      enhancedHistory, // Usar o histórico aprimorado
      userId,
      setMessages,
      apiService.sendRequest,
      mediaGallery.saveMediaToGallery
    );
  };
  
  // Função auxiliar para preparar o histórico da conversa
  const prepareConversationHistory = (messages: MessageType[]): string => {
    // Incluir mais mensagens para manter melhor contexto (25 mensagens)
    // mas limitar quantidade para não exceder limites de tokens
    const recentMessages = messages.slice(-25);
    
    return recentMessages.map(msg => {
      // Incluir informação do modelo usado nas respostas para melhor contexto
      const modelInfo = msg.model ? ` (${msg.model})` : '';
      const role = msg.sender === 'user' ? 'User' : `Assistant${modelInfo}`;
      
      // Incluir apenas conteúdo relevante para o contexto (ignorar mensagens de erro)
      if (msg.error) return '';
      
      // Filtrar URLs de mídia longas no contexto para economizar tokens
      let cleanContent = msg.content;
      // Remover URLs e dados base64 grandes para economizar tokens
      cleanContent = cleanContent.replace(/data:image\/[^;]+;base64,[^\s]{100,}/g, '[IMAGEM]');
      cleanContent = cleanContent.replace(/(https?:\/\/[^\s]{50,})/g, '[URL]');
      
      return `${role}: ${cleanContent}`;
    })
    .filter(msg => msg !== '') // Remover mensagens vazias (como erros filtrados)
    .join('\n\n');
  };
  
  return {
    handleSingleModelMessage: handleSingleModel,
    handleCompareModels: handleCompareModelMessages,
    prepareConversationHistory // Exportar função auxiliar
  };
};
