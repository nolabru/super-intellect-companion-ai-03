
import { v4 as uuidv4 } from 'uuid';
import { MessageType } from '@/components/ChatMessage';
import { ChatMode } from '@/components/ModeSelector';
import { LumaParams } from '@/components/LumaParamsButton';
import { useApiService } from '@/hooks/useApiService';
import { useMediaGallery } from '@/hooks/useMediaGallery';
import { saveMessageToDatabase, updateConversationTitle } from '@/utils/conversationUtils';
import { ConversationType } from '@/types/conversation';

// Factory function to create message service
export const createMessageService = (
  apiService: ReturnType<typeof useApiService>,
  mediaGallery: ReturnType<typeof useMediaGallery>,
  setMessages: React.Dispatch<React.SetStateAction<MessageType[]>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
) => {
  
  // Handle single model message
  const handleSingleModelMessage = async (
    content: string,
    mode: ChatMode,
    modelId: string,
    conversationId: string,
    messages: MessageType[],
    conversations: ConversationType[],
    files?: string[],
    params?: LumaParams,
    conversationHistory?: string,
    userId?: string
  ) => {
    // Add loading message
    const loadingId = `loading-${modelId}-${uuidv4()}`;
    
    let loadingMessage = 'Generating response...';
    
    // Specific loading messages for each mode
    if (mode === 'video') {
      if (modelId === 'luma-video') {
        loadingMessage = 'Connecting to Luma AI for video processing...';
      } else if (modelId === 'kligin-video') {
        loadingMessage = 'Waiting for Kligin AI service processing...';
      }
    } else if (mode === 'image') {
      if (modelId === 'luma-image') {
        loadingMessage = 'Connecting to Luma AI for image generation...';
      }
    }
    
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
      // Verificar se o modelo suporta streaming (modelos OpenAI de texto)
      const supportsStreaming = mode === 'text' && (
        modelId.includes('gpt') || 
        modelId.includes('claude') || 
        modelId.includes('gemini')
      );
      
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
        const streamResponse = await apiService.sendRequest(
          content, 
          mode, 
          modelId, 
          files, 
          params, 
          true, // indicar que queremos streaming
          streamListener,
          conversationHistory, // Novo parâmetro - histórico da conversa
          userId // Novo parâmetro - ID do usuário
        );
        
        // Atualizar a mensagem final (remover flag de streaming)
        setMessages((prevMessages) => 
          prevMessages.map(msg => 
            msg.id === messageId 
              ? { ...msg, content: streamedContent, streaming: false }
              : msg
          )
        );
        
        // Salvar a mensagem final no banco de dados
        const finalMessage: MessageType = {
          id: messageId,
          content: streamedContent,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          model: modelId,
          mode,
          files: streamResponse.files,
          mediaUrl: streamResponse.files && streamResponse.files.length > 0 ? streamResponse.files[0] : undefined
        };
        
        await saveMessageToDatabase(finalMessage, conversationId);
        
        // Always save media to gallery if exists
        if (mode !== 'text' && 
            streamResponse.files && 
            streamResponse.files.length > 0) {
          try {
            await mediaGallery.saveMediaToGallery(
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
          modeSwitch: streamResponse.modeSwitch // Nova propriedade
        };
      } else {
        // Send request to API with 3 minute timeout for modelos sem streaming
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Request timeout exceeded")), 180000);
        });
        
        const responsePromise = apiService.sendRequest(
          content, 
          mode, 
          modelId, 
          files, 
          params,
          false,
          undefined,
          conversationHistory, // Novo parâmetro - histórico da conversa
          userId // Novo parâmetro - ID do usuário
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
        
        // Add real response
        const newMessage: MessageType = {
          id: uuidv4(),
          content: response.content,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          model: modelId,
          mode: response.modeSwitch?.newMode || mode, // Usar novo modo se detectado
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
            await mediaGallery.saveMediaToGallery(
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
          modeSwitch: response.modeSwitch // Nova propriedade
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
      let friendlyError = `An error occurred processing your request. ${errorMsg}`;
      
      if (mode === 'video' && modelId.includes('luma')) {
        friendlyError = `Video generation error: ${errorMsg}. Please check if the Luma API key is configured correctly.`;
      } else if (mode === 'image' && modelId.includes('luma')) {
        friendlyError = `Image generation error: ${errorMsg}. Please check if the Luma API key is configured correctly.`;
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
  
  // Handle comparing models - improved for model-specific responses
  const handleCompareModels = async (
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
    // Adicionar verificação de streaming para modelos de comparação
    const leftSupportsStreaming = mode === 'text' && (
      leftModelId.includes('gpt') || 
      leftModelId.includes('claude') || 
      leftModelId.includes('gemini')
    );
    
    const rightSupportsStreaming = mode === 'text' && (
      rightModelId.includes('gpt') || 
      rightModelId.includes('claude') || 
      rightModelId.includes('gemini')
    );

    // Add loading messages
    const loadingIdLeft = `loading-${leftModelId}-${uuidv4()}`;
    const loadingIdRight = `loading-${rightModelId}-${uuidv4()}`;
    
    const loadingMessages: MessageType[] = [
      {
        id: loadingIdLeft,
        content: 'Generating response...',
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        model: leftModelId,
        mode,
        loading: true
      },
      {
        id: loadingIdRight,
        content: 'Generating response...',
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
      
      // Send to API for both models in parallel
      const [responseLeft, responseRight] = await Promise.all([
        apiService.sendRequest(
          content, 
          mode, 
          leftModelId, 
          files, 
          params, 
          leftSupportsStreaming, 
          leftStreamListener,
          conversationHistory,
          userId
        ),
        apiService.sendRequest(
          content, 
          mode, 
          rightModelId, 
          files, 
          params, 
          rightSupportsStreaming, 
          rightStreamListener,
          conversationHistory,
          userId
        )
      ]);
      
      console.log("API responses received for comparison:", {
        leftModel: leftModelId,
        rightModel: rightModelId,
        leftHasFiles: responseLeft.files && responseLeft.files.length > 0,
        rightHasFiles: responseRight.files && responseRight.files.length > 0,
        leftModeSwitch: responseLeft.modeSwitch ? 'detected' : 'none',
        rightModeSwitch: responseRight.modeSwitch ? 'detected' : 'none'
      });
      
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
          mode: responseLeft.modeSwitch?.newMode || mode, // Usar novo modo se detectado
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
          mode: responseRight.modeSwitch?.newMode || mode, // Usar novo modo se detectado
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
          mode: responseLeft.modeSwitch?.newMode || mode,
          files: responseLeft.files,
          mediaUrl: responseLeft.files && responseLeft.files.length > 0 ? responseLeft.files[0] : undefined
        }, conversationId),
        saveMessageToDatabase({
          id: rightMessageId,
          content: rightSupportsStreaming ? rightStreamedContent : responseRight.content,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          model: rightModelId,
          mode: responseRight.modeSwitch?.newMode || mode,
          files: responseRight.files,
          mediaUrl: responseRight.files && responseRight.files.length > 0 ? responseRight.files[0] : undefined
        }, conversationId)
      ]);
      
      // Always save both media files to gallery to ensure persistence
      if (mode !== 'text') {
        // For left model
        if (responseLeft.files && responseLeft.files.length > 0) {
          try {
            await mediaGallery.saveMediaToGallery(
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
            await mediaGallery.saveMediaToGallery(
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
  
  return {
    handleSingleModelMessage,
    handleCompareModels
  };
};
