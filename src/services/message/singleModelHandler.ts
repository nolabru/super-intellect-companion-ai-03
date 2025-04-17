
import { v4 as uuidv4 } from 'uuid';
import { MessageType } from '@/components/ChatMessage';
import { ChatMode } from '@/components/ModeSelector';
import { LumaParams } from '@/components/LumaParamsButton';
import { ApiResponse } from '@/hooks/useApiService';
import { ConversationType } from '@/types/conversation';
import { saveMessageToDatabase } from '@/utils/conversationUtils';
import { validateChatMode, getLoadingMessage, modelSupportsStreaming } from './chatModeUtils';

/**
 * Gerencia o envio de mensagens para um único modelo
 */
export const handleSingleModelMessage = async (
  content: string,
  mode: ChatMode,
  modelId: string,
  conversationId: string,
  messages: MessageType[],
  conversations: ConversationType[],
  files: string[] | undefined,
  params: LumaParams | undefined,
  conversationHistory: string | undefined,
  userId: string | undefined,
  setMessages: React.Dispatch<React.SetStateAction<MessageType[]>>,
  sendApiRequest: (
    content: string, 
    mode: ChatMode, 
    modelId: string, 
    files?: string[],
    params?: LumaParams,
    enableStreaming?: boolean,
    streamListener?: (chunk: string) => void,
    conversationHistory?: string,
    userId?: string
  ) => Promise<ApiResponse>,
  saveMediaToGallery: (
    mediaUrl: string,
    prompt: string,
    mediaType: string,
    modelId: string,
    params?: LumaParams
  ) => Promise<any>,
  skipUserMessage: boolean = false // Novo parâmetro para controlar a criação da mensagem do usuário
) => {
  // Criar mensagem do usuário se não for para pular
  if (!skipUserMessage) {
    const userMessageId = uuidv4();
    const userMessage: MessageType = {
      id: userMessageId,
      content,
      sender: 'user',
      timestamp: new Date().toISOString(),
      model: modelId, // Define o modelo específico para a mensagem do usuário
      mode,
      files
    };
    
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    await saveMessageToDatabase(userMessage, conversationId);
  }

  // Adicionar mensagem de carregamento
  const loadingId = `loading-${modelId}-${uuidv4()}`;
  const loadingMessage = getLoadingMessage(mode, modelId);
  
  const loadingMsg: MessageType = {
    id: loadingId,
    content: loadingMessage,
    sender: 'assistant',
    timestamp: new Date().toISOString(),
    model: modelId,
    mode,
    loading: true
  };
  
  setMessages((prevMessages) => [...prevMessages, loadingMsg]);
  
  try {
    // Log mais detalhado para depuração do contexto
    if (conversationHistory) {
      console.log(`[singleModelHandler] Enviando contexto: ${conversationHistory.length} caracteres`);
      console.log(`[singleModelHandler] Primeiros 150 caracteres: ${conversationHistory.substring(0, 150)}...`);
      console.log(`[singleModelHandler] Últimos 150 caracteres: ${conversationHistory.substring(conversationHistory.length - 150)}...`);
    } else {
      console.log(`[singleModelHandler] ATENÇÃO: Sem contexto para enviar! Isso pode causar perda de contexto.`);
    }
    
    // Verificar se o modelo suporta streaming
    const supportsStreaming = modelSupportsStreaming(mode, modelId);
    
    if (supportsStreaming) {
      // Criar o ID da mensagem para streaming
      const messageId = uuidv4();
      
      // Substituir a mensagem de loading com uma mensagem de streaming
      setMessages((prevMessages) => {
        const filteredMessages = prevMessages.filter(msg => msg.id !== loadingId);
        return [...filteredMessages, {
          id: messageId,
          content: '',
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          model: modelId,
          mode,
          streaming: true
        }];
      });
      
      // Preparar para iniciar o streaming
      let streamedContent = '';
      const streamListener = (chunk: string) => {
        streamedContent = chunk; // No streaming simulado, recebemos o conteúdo acumulado
        setMessages((prevMessages) => {
          return prevMessages.map(msg => 
            msg.id === messageId 
              ? { ...msg, content: streamedContent }
              : msg
          );
        });
      };
      
      // Enviar solicitação com suporte a streaming
      const streamResponse = await sendApiRequest(
        content, 
        mode, 
        modelId, 
        files, 
        params, 
        true, // indicar que queremos streaming
        streamListener,
        conversationHistory, // Garantir que o contexto seja enviado
        userId
      );
      
      // Atualizar a mensagem final (remover flag de streaming)
      setMessages((prevMessages) => 
        prevMessages.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: streamedContent, streaming: false }
            : msg
        )
      );
      
      // Validate and convert the mode from response
      const validatedMode = validateChatMode(
        streamResponse.modeSwitch?.newMode || mode
      );
      
      // Salvar a mensagem final no banco de dados
      const finalMessage: MessageType = {
        id: messageId,
        content: streamedContent,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        model: modelId,
        mode: validatedMode,
        files: streamResponse.files,
        mediaUrl: streamResponse.files && streamResponse.files.length > 0 ? streamResponse.files[0] : undefined
      };
      
      await saveMessageToDatabase(finalMessage, conversationId);
      
      // Always save media to gallery if exists
      if (mode !== 'text' && 
          streamResponse.files && 
          streamResponse.files.length > 0) {
        try {
          await saveMediaToGallery(
            streamResponse.files[0],
            content,
            mode,
            modelId,
            params
          );
          console.log('[messageService] Media saved to gallery successfully');
        } catch (err) {
          console.error('[messageService] Error saving media to gallery:', err);
          // Continue even if gallery save fails
        }
      }
      
      return { 
        success: true, 
        error: null,
        modeSwitch: streamResponse.modeSwitch
      };
    } else {
      // Send request to API with appropriate timeout based on model
      const timeoutDuration = 
        (modelId === 'kligin-video' || modelId === 'luma-video') ? 300000 : // 5 minutes for video generation
        (modelId.includes('kligin') || modelId.includes('luma')) ? 180000 : // 3 minutes for other Kligin/Luma services
        180000; // 3 minutes default timeout
      
      console.log(`[singleModelHandler] Setting timeout of ${timeoutDuration/1000} seconds for ${modelId} request`);
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout exceeded")), timeoutDuration);
      });
      
      const responsePromise = sendApiRequest(
        content, 
        mode, 
        modelId, 
        files, 
        params,
        false,
        undefined,
        conversationHistory, // Garantir que o contexto seja enviado
        userId
      );
      const response = await Promise.race([responsePromise, timeoutPromise]) as Awaited<typeof responsePromise>;
      
      // Remove loading message
      setMessages((prevMessages) => 
        prevMessages.filter(msg => msg.id !== loadingId)
      );
      
      console.log("API response received:", {
        mode,
        modelId,
        hasFiles: response.files && response.files.length > 0,
        firstFile: response.files && response.files.length > 0 ? response.files[0].substring(0, 30) + '...' : 'none',
        modeSwitch: response.modeSwitch ? 'detected' : 'none'
      });
      
      // Validate and convert the mode from response
      const validatedMode = validateChatMode(
        response.modeSwitch?.newMode || mode
      );
      
      // Add real response
      const newMessage: MessageType = {
        id: uuidv4(),
        content: response.content,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        model: modelId,
        mode: validatedMode,
        files: response.files,
        mediaUrl: response.files && response.files.length > 0 ? response.files[0] : undefined
      };
      
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      
      // Save message in database
      await saveMessageToDatabase(newMessage, conversationId);
      
      // Always save media to gallery if exists - this ensures video persistency across refreshes
      if (mode !== 'text' && 
          response.files && 
          response.files.length > 0) {
        try {
          await saveMediaToGallery(
            response.files[0],
            content,
            mode,
            modelId,
            params
          );
          console.log('[messageService] Media saved to gallery successfully');
        } catch (err) {
          console.error('[messageService] Error saving media to gallery:', err);
          // Continue even if gallery save fails
        }
      }
      
      return { 
        success: true, 
        error: null,
        modeSwitch: response.modeSwitch
      };
    }
  } catch (err) {
    console.error("Error during request:", err);
    
    // Remove loading message
    setMessages((prevMessages) => 
      prevMessages.filter(msg => msg.id !== loadingId)
    );
    
    // Add specific error message based on mode and error
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    let friendlyError = `Ocorreu um erro ao processar sua solicitação. ${errorMsg}`;
    
    // Detectar erros específicos para mostrar melhores mensagens
    if (errorMsg.includes('tokens') || errorMsg.includes('Tokens') || errorMsg.includes('402') || errorMsg.includes('INSUFFICIENT_TOKENS')) {
      friendlyError = 'Você não tem tokens suficientes para esta operação. Aguarde o próximo reset mensal ou entre em contato com o suporte.';
    } else if (errorMsg.includes('API key') || errorMsg.includes('Authentication')) {
      friendlyError = 'Erro de autenticação na API. Verifique se a chave da API está configurada corretamente.';
    } else if (mode === 'video' && modelId.includes('luma')) {
      friendlyError = `Erro na geração de vídeo: ${errorMsg}. Verifique se a chave API do Luma está configurada corretamente.`;
    } else if (mode === 'image' && modelId.includes('luma')) {
      friendlyError = `Erro na geração de imagem: ${errorMsg}. Verifique se a chave API do Luma está configurada corretamente.`;
    } else if (mode === 'video' && modelId.includes('kligin')) {
      friendlyError = `Erro na geração de vídeo: ${errorMsg}. Verifique se a chave API do Kligin está configurada corretamente.`;
    } else if (mode === 'image' && modelId.includes('kligin')) {
      friendlyError = `Erro na geração de imagem: ${errorMsg}. Verifique se a chave API do Kligin está configurada corretamente.`;
    }
    
    const errorMessage: MessageType = {
      id: uuidv4(),
      content: friendlyError,
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      model: modelId,
      mode,
      error: true
    };
    
    setMessages((prevMessages) => [...prevMessages, errorMessage]);
    
    // Save error message to database
    await saveMessageToDatabase(errorMessage, conversationId);
    
    throw err; // Re-throw to be caught by the outer catch
  }
};
