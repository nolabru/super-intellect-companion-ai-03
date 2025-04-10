
import { createConversation, deleteConversation as deleteConversationFromDB, renameConversation as renameConversationFromDB, loadConversationMessages, updateConversationTitle as updateConversationTitleInDB } from '../utils/conversationUtils';
import { ConversationType } from '@/types/conversation';
import { MessageType } from '@/components/ChatMessage';
import { toast } from 'sonner';

// Load messages
export const loadMessages = async (
  conversationId: string,
  setLoading: (loading: boolean) => void,
  setMessages: React.Dispatch<React.SetStateAction<MessageType[]>>,
  clearMessages: () => void,
  setError: (error: string | null) => void
) => {
  try {
    console.log(`[conversationActions] Loading messages for conversation: ${conversationId}`);
    
    setLoading(true);
    
    // Limpar mensagens antes de carregar novas para um feedback visual imediato
    clearMessages();
    
    const { data, error } = await loadConversationMessages(conversationId);
    
    if (error) {
      console.error('[conversationActions] Error loading messages:', error);
      setError(error);
      return false;
    }
    
    if (data) {
      console.log(`[conversationActions] Setting ${data.length} messages from conversation ${conversationId}`);
      // Definir mensagens do banco de dados diretamente
      setMessages(data as MessageType[]);
    } else {
      console.log(`[conversationActions] No messages found for conversation ${conversationId}`);
      // Garantir que as mensagens sejam limpas se não houver
      clearMessages();
      setMessages([]);
    }
    
    return true;
  } catch (err) {
    console.error('[conversationActions] Error loading messages:', err);
    setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar mensagens');
    return false;
  } finally {
    setLoading(false);
  }
};

// Create a new conversation
export const createNewConversation = async (
  setLoading: (loading: boolean) => void,
  addConversation: (conversation: any) => void,
  clearMessages: () => void,
  setError: (error: string | null) => void
) => {
  try {
    console.log('[conversationActions] Creating new conversation');
    setLoading(true);
    
    // Limpar mensagens em vários pontos para garantir que a interface do usuário seja atualizada
    clearMessages();
    
    // Criar a conversa no banco de dados
    const { data, error, success } = await createConversation();
    
    if (error) {
      console.error('[conversationActions] Error creating conversation:', error);
      setError(error);
      toast.error('Erro ao criar nova conversa');
      return { success: false };
    }
    
    if (data) {
      console.log('[conversationActions] New conversation created:', data.id);
      // Adicionar a nova conversa ao estado
      addConversation(data);
      
      // Limpar mensagens novamente após a conversa ser criada
      clearMessages();
      
      toast.success('Nova conversa criada');
      return { success: true, data };
    }
    
    toast.error('Erro ao criar nova conversa');
    return { success: false };
  } catch (err) {
    console.error('[conversationActions] Error creating conversation:', err);
    setError(err instanceof Error ? err.message : 'Erro desconhecido ao criar conversa');
    toast.error('Erro ao criar nova conversa');
    return { success: false };
  } finally {
    setLoading(false);
  }
};

// Delete conversation
export const deleteConversation = async (
  id: string,
  setLoading: (loading: boolean) => void,
  removeConversation: (id: string) => void,
  setError: (error: string | null) => void
) => {
  try {
    console.log(`[conversationActions] Deleting conversation: ${id}`);
    
    setLoading(true);
    
    const { error, success } = await deleteConversationFromDB(id);
    
    if (error || !success) {
      console.error('[conversationActions] Error deleting conversation:', error);
      setError(error || 'Erro desconhecido ao excluir conversa');
      toast.error('Erro ao excluir conversa');
      return false;
    }
    
    console.log(`[conversationActions] Conversation ${id} deleted successfully`);
    removeConversation(id);
    toast.success('Conversa excluída com sucesso');
    return true;
  } catch (err) {
    console.error('[conversationActions] Error deleting conversation:', err);
    setError(err instanceof Error ? err.message : 'Erro desconhecido ao excluir conversa');
    toast.error('Erro ao excluir conversa');
    return false;
  } finally {
    setLoading(false);
  }
};

// Rename conversation
export const renameConversation = async (
  id: string,
  newTitle: string,
  setLoading: (loading: boolean) => void,
  updateConversationTitle: (id: string, newTitle: string) => void,
  setError: (error: string | null) => void
) => {
  try {
    console.log(`[conversationActions] Renaming conversation ${id} to: ${newTitle}`);
    
    setLoading(true);
    
    const { error, success } = await renameConversationFromDB(id, newTitle);
    
    if (error || !success) {
      console.error('[conversationActions] Error renaming conversation:', error);
      setError(error || 'Erro desconhecido ao renomear conversa');
      toast.error('Erro ao renomear conversa');
      return false;
    }
    
    console.log(`[conversationActions] Conversation ${id} renamed successfully`);
    updateConversationTitle(id, newTitle);
    toast.success('Conversa renomeada com sucesso');
    return true;
  } catch (err) {
    console.error('[conversationActions] Error renaming conversation:', err);
    setError(err instanceof Error ? err.message : 'Erro desconhecido ao renomear conversa');
    toast.error('Erro ao renomear conversa');
    return false;
  } finally {
    setLoading(false);
  }
};

// Handle conversation title update
export const handleTitleUpdate = async (
  conversations: ConversationType[],
  updateConversationTitle: (id: string, newTitle: string) => void,
  conversationId: string,
  content: string
): Promise<boolean> => {
  try {
    // Verificar se a conversa selecionada está na lista de conversas
    const selectedConversation = conversations.find(
      conv => conv.id === conversationId
    );
    
    if (!selectedConversation) {
      console.warn(`[conversationActions] Cannot update title: Conversation ${conversationId} not found`);
      return false;
    }
    
    // Verificar se o título atual é "Nova Conversa"
    if (selectedConversation.title !== 'Nova Conversa') {
      console.log(`[conversationActions] Not updating title: Current title is not default (${selectedConversation.title})`);
      return false;
    }
    
    // Atualizar título com base no conteúdo da mensagem
    const { data, error, success } = await updateConversationTitleInDB(
      conversationId,
      content,
      conversations
    );
    
    if (error || !success) {
      console.error('[conversationActions] Error updating conversation title:', error);
      return false;
    }
    
    if (data?.newTitle) {
      console.log(`[conversationActions] Conversation ${conversationId} title updated to: ${data.newTitle}`);
      updateConversationTitle(conversationId, data.newTitle);
      return true;
    }
    
    return false;
  } catch (err) {
    console.error('[conversationActions] Error updating conversation title:', err);
    return false;
  }
};
