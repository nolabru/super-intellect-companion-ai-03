
import { v4 as uuidv4 } from 'uuid';
import { MessageType } from '@/components/ChatMessage';
import { ChatMode } from '@/components/ModeSelector';
import { LumaParams } from '@/components/LumaParamsButton';
import { ApiResponse } from '@/hooks/useApiService';
import { saveMessageToDatabase } from '@/utils/conversationUtils';
import { validateChatMode, modelSupportsStreaming } from './chatModeUtils';

/**
 * Gerencia a comparação entre dois modelos diferentes
 */
export const handleCompareModels = async (
  content: string,
  mode: ChatMode,
  leftModelId: string,
  rightModelId: string,
  conversationId: string,
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
  ) => Promise<any>
) => {
  // Verificar suporte a streaming para ambos os modelos
  const leftSupportsStreaming = modelSupportsStreaming(mode, leftModelId);
  const rightSupportsStreaming = modelSupportsStreaming(mode, rightModelId);

  // Adicionar mensagens de carregamento
  const loadingIdLeft = `loading-${leftModelId}-${uuidv4()}`;
  const loadingIdRight = `loading-${rightModelId}-${uuidv4()}`;
  
  const loadingMessages: MessageType[] = [
    {
      id: loadingIdLeft,
      content: 'Gerando resposta...',
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      model: leftModelId,
      mode,
      loading: true
    },
    {
      id: loadingIdRight,
      content: 'Gerando resposta...',
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      model: rightModelId,
      mode,
      loading: true
    }
  ];
  
  setMessages((prevMessages) => [...prevMessages, ...loadingMessages]);
  
  try {
    // Criar IDs para mensagens de streaming
    const leftMessageId = uuidv4();
    const rightMessageId = uuidv4();
    
    if (leftSupportsStreaming) {
      // Substituir a mensagem de loading com uma mensagem de streaming para o modelo esquerdo
      setMessages((prevMessages) => {
        const filteredMessages = prevMessages.filter(msg => msg.id !== loadingIdLeft);
        return [...filteredMessages, {
          id: leftMessageId,
          content: '',
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          model: leftModelId,
          mode,
          streaming: true
        }];
      });
    }
    
    if (rightSupportsStreaming) {
      // Substituir a mensagem de loading com uma mensagem de streaming para o modelo direito
      setMessages((prevMessages) => {
        const filteredMessages = prevMessages.filter(msg => msg.id !== loadingIdRight);
        return [...filteredMessages, {
          id: rightMessageId,
          content: '',
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          model: rightModelId,
          mode,
          streaming: true
        }];
      });
    }
    
    // Preparar listeners para streaming
    let leftStreamedContent = '';
    let rightStreamedContent = '';
    
    const leftStreamListener = (chunk: string) => {
      if (leftSupportsStreaming) {
        leftStreamedContent = chunk; // Conteúdo acumulado
        setMessages((prevMessages) => {
          return prevMessages.map(msg => 
            msg.id === leftMessageId 
              ? { ...msg, content: leftStreamedContent }
              : msg
          );
        });
      }
    };
    
    const rightStreamListener = (chunk: string) => {
      if (rightSupportsStreaming) {
        rightStreamedContent = chunk; // Conteúdo acumulado
        setMessages((prevMessages) => {
          return prevMessages.map(msg => 
            msg.id === rightMessageId 
              ? { ...msg, content: rightStreamedContent }
              : msg
          );
        });
      }
    };
    
    // IMPORTANTE: Criar e iniciar as duas requisições simultaneamente
    const leftRequestPromise = sendApiRequest(
      content, 
      mode, 
      leftModelId, 
      files, 
      params, 
      leftSupportsStreaming, 
      leftStreamListener,
      conversationHistory,
      userId
    );
    
    const rightRequestPromise = sendApiRequest(
      content, 
      mode, 
      rightModelId, 
      files, 
      params, 
      rightSupportsStreaming, 
      rightStreamListener,
      conversationHistory,
      userId
    );
    
    // Send to API for both models in parallel and wait for BOTH to complete
    const [responseLeft, responseRight] = await Promise.all([
      leftRequestPromise,
      rightRequestPromise
    ]);
    
    console.log("API responses received for comparison:", {
      leftModel: leftModelId,
      rightModel: rightModelId,
      leftHasFiles: responseLeft.files && responseLeft.files.length > 0,
      rightHasFiles: responseRight.files && responseRight.files.length > 0,
      leftModeSwitch: responseLeft.modeSwitch ? 'detected' : 'none',
      rightModeSwitch: responseRight.modeSwitch ? 'detected' : 'none'
    });
    
    // Validate and convert the modes from responses
    const leftValidatedMode = validateChatMode(
      responseLeft.modeSwitch?.newMode || mode
    );
    
    const rightValidatedMode = validateChatMode(
      responseRight.modeSwitch?.newMode || mode
    );
    
    // Remove loading messages que podem ainda existir
    setMessages((prevMessages) => 
      prevMessages.filter(msg => 
        msg.id !== loadingIdLeft && 
        msg.id !== loadingIdRight
      )
    );
    
    // Atualizar mensagens de streaming para remover flag de streaming
    if (leftSupportsStreaming) {
      setMessages((prevMessages) => 
        prevMessages.map(msg => 
          msg.id === leftMessageId 
            ? { ...msg, streaming: false }
            : msg
        )
      );
    }
    
    if (rightSupportsStreaming) {
      setMessages((prevMessages) => 
        prevMessages.map(msg => 
          msg.id === rightMessageId 
            ? { ...msg, streaming: false }
            : msg
        )
      );
    }
    
    // Adicionar mensagens finais para modelos sem streaming
    const newMessages: MessageType[] = [];
    
    if (!leftSupportsStreaming) {
      newMessages.push({
        id: leftMessageId,
        content: responseLeft.content,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        model: leftModelId,
        mode: leftValidatedMode,
        files: responseLeft.files,
        mediaUrl: responseLeft.files && responseLeft.files.length > 0 ? responseLeft.files[0] : undefined
      });
    }
    
    if (!rightSupportsStreaming) {
      newMessages.push({
        id: rightMessageId,
        content: responseRight.content,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        model: rightModelId,
        mode: rightValidatedMode,
        files: responseRight.files,
        mediaUrl: responseRight.files && responseRight.files.length > 0 ? responseRight.files[0] : undefined
      });
    }
    
    if (newMessages.length > 0) {
      setMessages((prevMessages) => [...prevMessages, ...newMessages]);
    }
    
    // Save messages to database
    await Promise.all([
      saveMessageToDatabase({
        id: leftMessageId,
        content: leftSupportsStreaming ? leftStreamedContent : responseLeft.content,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        model: leftModelId,
        mode: leftValidatedMode,
        files: responseLeft.files,
        mediaUrl: responseLeft.files && responseLeft.files.length > 0 ? responseLeft.files[0] : undefined
      }, conversationId),
      saveMessageToDatabase({
        id: rightMessageId,
        content: rightSupportsStreaming ? rightStreamedContent : responseRight.content,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        model: rightModelId,
        mode: rightValidatedMode,
        files: responseRight.files,
        mediaUrl: responseRight.files && responseRight.files.length > 0 ? responseRight.files[0] : undefined
      }, conversationId)
    ]);
    
    // Always save both media files to gallery to ensure persistence
    if (mode !== 'text') {
      // For left model
      if (responseLeft.files && responseLeft.files.length > 0) {
        try {
          await saveMediaToGallery(
            responseLeft.files[0],
            content,
            mode,
            leftModelId,
            params
          );
          console.log('[messageService] Left model media saved to gallery successfully');
        } catch (err) {
          console.error('[messageService] Error saving left model media to gallery:', err);
          // Continue even if gallery save fails
        }
      }
      
      // For right model
      if (responseRight.files && responseRight.files.length > 0) {
        try {
          await saveMediaToGallery(
            responseRight.files[0],
            content,
            mode,
            rightModelId,
            params
          );
          console.log('[messageService] Right model media saved to gallery successfully');
        } catch (err) {
          console.error('[messageService] Error saving right model media to gallery:', err);
          // Continue even if gallery save fails
        }
      }
    }
    
    // Determinar se houve troca de modo
    // Se ambos modelos solicitarem a troca de modo, escolhemos o primeiro que encontramos
    const modeSwitch = responseLeft.modeSwitch || responseRight.modeSwitch;
    
    return { success: true, error: null, modeSwitch };
  } catch (err) {
    console.error("Error during comparison of models:", err);
    
    // Remove loading messages
    setMessages((prevMessages) => 
      prevMessages.filter(msg => msg.id !== loadingIdLeft && msg.id !== loadingIdRight)
    );
    
    // Add error message for both models
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    const errorMessage: MessageType = {
      id: uuidv4(),
      content: `Error during model comparison: ${errorMsg}`,
      sender: 'assistant',
      timestamp: new Date().toISOString(),
      model: leftModelId,
      mode,
      error: true
    };
    
    setMessages((prevMessages) => [...prevMessages, errorMessage]);
    
    // Save error message
    await saveMessageToDatabase(errorMessage, conversationId);
    
    throw err;
  }
};
