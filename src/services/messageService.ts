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
      // Send request to API with 3 minute timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout exceeded")), 180000);
      });
      
      const responsePromise = apiService.sendRequest(content, mode, modelId, files, params);
      const response = await Promise.race([responsePromise, timeoutPromise]) as Awaited<typeof responsePromise>;
      
      // Remove loading message
      setMessages((prevMessages) => 
        prevMessages.filter(msg => msg.id !== loadingId)
      );
      
      console.log("API response received:", {
        mode,
        modelId,
        hasFiles: response.files && response.files.length > 0,
        firstFile: response.files && response.files.length > 0 ? response.files[0].substring(0, 30) + '...' : 'none'
      });
      
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
      
      // Always save media to gallery if exists - this ensures video persistency across refreshes
      if (mode !== 'text' && response.files && response.files.length > 0) {
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
      
      return { success: true, error: null };
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
  
  // Handle comparing models - improved to better handle media
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
      // Send to API for both models in parallel
      const [responseLeft, responseRight] = await Promise.all([
        apiService.sendRequest(content, mode, leftModelId, files, params),
        apiService.sendRequest(content, mode, rightModelId, files, params)
      ]);
      
      console.log("API responses received for comparison:", {
        leftModel: leftModelId,
        rightModel: rightModelId,
        leftHasFiles: responseLeft.files && responseLeft.files.length > 0,
        rightHasFiles: responseRight.files && responseRight.files.length > 0,
      });
      
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
      
      return { success: true, error: null };
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
