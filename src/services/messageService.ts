
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

    // Preparar o histórico de conversa para manter contexto
    // Se não for fornecido externamente, preparar a partir das mensagens atuais
    const enhancedHistory = conversationHistory || prepareConversationHistory(messages);
    console.log(`[messageService] Enviando mensagem para ${modelId} com contexto de ${enhancedHistory.length} caracteres`);
    console.log(`[messageService] Primeiras 150 caracteres do contexto: ${enhancedHistory.substring(0, 150)}...`);

    return handleSingleModelMessage(
      content,
      mode,
      modelId,
      conversationId,
      messages,
      conversations,
      files,
      params,
      enhancedHistory, // Passar o histórico aprimorado
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
    messages: MessageType[], // Parâmetro de mensagens
    files?: string[],
    params?: LumaParams,
    conversationHistory?: string,
    userId?: string
  ) => {
    // Preparar o histórico de conversa para manter contexto
    // Se não for fornecido externamente, preparar a partir das mensagens atuais
    const enhancedHistory = conversationHistory || prepareConversationHistory(messages);
    console.log(`[messageService] Enviando mensagem para comparação ${leftModelId} vs ${rightModelId} com contexto de ${enhancedHistory.length} caracteres`);
    console.log(`[messageService] Primeiras 150 caracteres do contexto: ${enhancedHistory.substring(0, 150)}...`);

    return handleCompareModels(
      content,
      mode,
      leftModelId,
      rightModelId,
      conversationId,
      files,
      params,
      enhancedHistory, // Passar o histórico aprimorado
      userId,
      setMessages,
      apiService.sendRequest,
      mediaGallery.saveMediaToGallery
    );
  };
  
  // Função aprimorada para preparar o histórico da conversa
  const prepareConversationHistory = (messages: MessageType[]): string => {
    if (!messages || messages.length === 0) {
      console.log('[messageService] Sem mensagens para preparar contexto');
      return '';
    }
    
    console.log(`[messageService] Preparando contexto com ${messages.length} mensagens`);
    
    // Incluir mais mensagens para manter melhor contexto (até 30 mensagens)
    // mas limitar quantidade para não exceder limites de tokens
    const recentMessages = messages.slice(-30);
    
    // Adicionando metadados iniciais ao contexto
    let context = "Histórico de conversa:\n\n";
    
    const formattedMessages = recentMessages.map(msg => {
      // Ignorar mensagens de sistema, loading ou erro
      if (msg.sender === 'system' || msg.loading || msg.error) {
        return null;
      }
      
      // Incluir informação do modelo usado nas respostas para melhor contexto
      const modelInfo = msg.model ? ` (modelo: ${msg.model})` : '';
      const role = msg.sender === 'user' ? 'Usuário' : `Assistente${modelInfo}`;
      
      // Limpar conteúdo muito grande
      let cleanContent = msg.content;
      
      // Remover URLs e dados base64 grandes para economizar tokens
      cleanContent = cleanContent.replace(/data:image\/[^;]+;base64,[^\s]{100,}/g, '[IMAGEM]');
      cleanContent = cleanContent.replace(/(https?:\/\/[^\s]{50,})/g, '[URL]');
      
      // Adicionar indicação de anexos
      const hasFiles = msg.files && msg.files.length > 0 
        ? ` [Inclui ${msg.files.length} arquivo(s)]` 
        : '';
      
      return `${role}${hasFiles}: ${cleanContent}`;
    })
    .filter(msg => msg !== null) // Remover mensagens filtradas
    .join('\n\n');
    
    context += formattedMessages;
    
    // Adicionar instrução para manter contexto
    context += '\n\nLembre-se das mensagens anteriores ao responder. O usuário espera que você mantenha o contexto da conversa.';
    
    return context;
  };
  
  return {
    handleSingleModelMessage: handleSingleModel,
    handleCompareModels: handleCompareModelMessages,
    prepareConversationHistory
  };
};
