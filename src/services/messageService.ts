
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
    params?: LumaParams
  ) => {
    // Add loading message
    const loadingId = `loading-${modelId}-${uuidv4()}`;
    
    let loadingMessage = 'Gerando resposta...';
    
    // Specific loading messages for each mode
    if (mode === 'video') {
      if (modelId === 'luma-video') {
        loadingMessage = 'Conectando ao serviço Luma AI para processamento de vídeo...';
      } else if (modelId === 'kligin-video') {
        loadingMessage = 'Aguardando processamento do serviço Kligin AI...';
      }
    } else if (mode === 'image') {
      if (modelId === 'luma-image') {
        loadingMessage = 'Conectando ao serviço Luma AI para geração de imagem...';
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
      // Send request to API with 3 minute timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Tempo limite excedido na solicitação")), 180000);
      });
      
      const responsePromise = apiService.sendRequest(content, mode, modelId, files, params);
      const response = await Promise.race([responsePromise, timeoutPromise]) as Awaited<typeof responsePromise>;
      
      // Remove loading message
      setMessages((prevMessages) => 
        prevMessages.filter(msg => msg.id !== loadingId)
      );
      
      // Add real response
      const newMessage: MessageType = {
        id: uuidv4(),
        content: response.content,
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        model: modelId,
        mode,
        files: response.files,
        mediaUrl: response.files && response.files.length > 0 ? response.files[0] : undefined
      };
      
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      
      // Save message in database
      await saveMessageToDatabase(newMessage, conversationId);
      
      // Save media to gallery if exists - isso garante que o vídeo seja persistente
      if (mode !== 'text' && response.files && response.files.length > 0) {
        try {
          await mediaGallery.saveMediaToGallery(
            response.files[0],
            content,
            mode,
            modelId,
            params
          );
          console.log('[messageService] Mídia salva na galeria com sucesso');
        } catch (err) {
          console.error('[messageService] Erro ao salvar mídia na galeria:', err);
          // Continuar mesmo que falhe ao salvar na galeria
        }
      }
      
      return { success: true, error: null };
    } catch (err) {
      console.error("Erro durante solicitação:", err);
      
      // Remove loading message
      setMessages((prevMessages) => 
        prevMessages.filter(msg => msg.id !== loadingId)
      );
      
      // Add specific error message based on mode and error
      const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
      let friendlyError = `Ocorreu um erro ao processar sua solicitação. ${errorMsg}`;
      
      if (mode === 'video' && modelId.includes('luma')) {
        friendlyError = `Erro na geração de vídeo: ${errorMsg}. Verifique se a chave API da Luma está configurada corretamente.`;
      } else if (mode === 'image' && modelId.includes('luma')) {
        friendlyError = `Erro na geração de imagem: ${errorMsg}. Verifique se a chave API da Luma está configurada corretamente.`;
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
  
  // Handle comparing models
  const handleCompareModels = async (
    content: string,
    mode: ChatMode,
    leftModelId: string,
    rightModelId: string,
    conversationId: string,
    files?: string[],
    params?: LumaParams
  ) => {
    // Add loading messages
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
      // Send to API for both models in parallel
      const [responseLeft, responseRight] = await Promise.all([
        apiService.sendRequest(content, mode, leftModelId, files, params),
        apiService.sendRequest(content, mode, rightModelId, files, params)
      ]);
      
      // Remove loading messages
      setMessages((prevMessages) => 
        prevMessages.filter(msg => msg.id !== loadingIdLeft && msg.id !== loadingIdRight)
      );
      
      // Add real responses
      const newMessages: MessageType[] = [
        {
          id: uuidv4(),
          content: responseLeft.content,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          model: leftModelId,
          mode,
          files: responseLeft.files,
          mediaUrl: responseLeft.files && responseLeft.files.length > 0 ? responseLeft.files[0] : undefined
        },
        {
          id: uuidv4(),
          content: responseRight.content,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          model: rightModelId,
          mode,
          files: responseRight.files,
          mediaUrl: responseRight.files && responseRight.files.length > 0 ? responseRight.files[0] : undefined
        }
      ];
      
      setMessages((prevMessages) => [...prevMessages, ...newMessages]);
      
      // Save messages to database
      await Promise.all(newMessages.map(msg => saveMessageToDatabase(msg, conversationId)));
      
      // Save media to gallery if exists - isso garante que os vídeos sejam persistentes
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
            console.log('[messageService] Mídia do modelo esquerdo salva na galeria com sucesso');
          } catch (err) {
            console.error('[messageService] Erro ao salvar mídia do modelo esquerdo na galeria:', err);
            // Continuar mesmo que falhe ao salvar na galeria
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
            console.log('[messageService] Mídia do modelo direito salva na galeria com sucesso');
          } catch (err) {
            console.error('[messageService] Erro ao salvar mídia do modelo direito na galeria:', err);
            // Continuar mesmo que falhe ao salvar na galeria
          }
        }
      }
      
      return { success: true, error: null };
    } catch (err) {
      console.error("Erro durante comparação de modelos:", err);
      
      // Remove loading messages
      setMessages((prevMessages) => 
        prevMessages.filter(msg => msg.id !== loadingIdLeft && msg.id !== loadingIdRight)
      );
      
      // Add error message for both models
      const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
      const errorMessage: MessageType = {
        id: uuidv4(),
        content: `Erro na comparação de modelos: ${errorMsg}`,
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
