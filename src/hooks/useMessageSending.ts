
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
    files?: string[]
  ) => {
    try {
      // Fechar sidebar em dispositivos móveis após enviar mensagem
      if (isMobile && sidebarOpen) {
        setSidebarOpen(false);
      }
      
      // Enviar mensagem usando a implementação simplificada
      const result = await sendMessage(content, currentConversationId);
      
      if (!result) {
        console.error("Erro ao enviar mensagem");
        return null;
      }
      
      return null;
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Não foi possível enviar a mensagem");
      return null;
    }
  }, [
    currentConversationId,
    sendMessage,
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
