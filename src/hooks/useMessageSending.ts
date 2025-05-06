
import { useCallback } from 'react';
import { toast } from 'sonner';
import { ChatMode } from '@/components/ModeSelector';
import { useConversation } from '@/hooks/useConversation';

export const useMessageSending = (
  activeMode: ChatMode,
  comparing: boolean,
  isLinked: boolean,
  leftModel: string,
  rightModel: string,
  generationParams: any,
  isMobile: boolean,
  sidebarOpen: boolean,
  setSidebarOpen: (open: boolean) => void
) => {
  const { 
    messages, 
    sendMessage, 
    loading: messagesLoading,
    initialLoadDone,
    currentConversationId,
    setCurrentConversationId
  } = useConversation();

  const handleSendMessage = useCallback(async (
    content: string, 
    files?: string[], 
    params?: any, 
    targetModel?: string
  ) => {
    const messageParams = params || generationParams;
    
    let result;
    
    if (comparing) {
      if (isLinked) {
        result = await sendMessage(
          content, 
          activeMode, 
          leftModel, 
          true, 
          leftModel, 
          rightModel,
          files,
          messageParams
        );
      } else {
        if (!targetModel) {
          console.error("Modelo alvo não especificado no modo desvinculado");
          return;
        }
        
        result = await sendMessage(
          content,
          activeMode,
          targetModel,
          true,
          targetModel === leftModel ? leftModel : null,
          targetModel === rightModel ? rightModel : null,
          files,
          messageParams
        );
      }
    } else {
      result = await sendMessage(
        content, 
        activeMode, 
        leftModel, 
        false,
        leftModel, 
        null,
        files,
        messageParams
      );
    }
    
    // Auto-close sidebar on mobile after sending a message
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
    
    if (result && result.success && result.modeSwitch) {
      toast.info(`Modo alterado para ${result.modeSwitch}`);
      return result.modeSwitch as ChatMode;
    }
    
    return null;
  }, [
    activeMode, 
    comparing, 
    isLinked, 
    leftModel, 
    rightModel, 
    sendMessage, 
    generationParams,
    isMobile,
    sidebarOpen,
    setSidebarOpen
  ]);

  return {
    messages,
    messagesLoading,
    initialLoadDone,
    currentConversationId,
    setCurrentConversationId,
    handleSendMessage
  };
};
