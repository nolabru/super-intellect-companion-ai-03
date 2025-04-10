
import { createConversation, deleteConversation as deleteConversationFromDB, renameConversation as renameConversationFromDB, loadConversationMessages, updateConversationTitle as updateConversationTitleInDB } from '../utils/conversationUtils';
import { ConversationType } from '@/types/conversation';
import { MessageType } from '@/components/ChatMessage';
import { toast } from 'sonner';

// Carregar mensagens
export const loadMessages = async (
  conversationId: string,
  setLoading: (loading: boolean) => void,
  setMessages: React.Dispatch<React.SetStateAction<MessageType[]>>,
  clearMessages: () => void,
  setError: (error: string | null) => void
) => {
  try {
    if (!conversationId) {
      console.error('[conversationActions] ID de conversa inválido');
      setError('ID de conversa inválido');
      return false;
    }
    
    console.log(`[conversationActions] Carregando mensagens para conversa: ${conversationId}`);
    
    setLoading(true);
    
    // Limpar mensagens antes de carregar novas para um feedback visual imediato
    clearMessages();
    
    const { data, error } = await loadConversationMessages(conversationId);
    
    if (error) {
      console.error('[conversationActions] Erro ao carregar mensagens:', error);
      setError(error);
      return false;
    }
    
    if (data) {
      console.log(`[conversationActions] Definindo ${data.length} mensagens da conversa ${conversationId}`);
      // Definir mensagens do banco de dados diretamente
      setMessages(data as MessageType[]);
    } else {
      console.log(`[conversationActions] Nenhuma mensagem encontrada para a conversa ${conversationId}`);
      // Garantir que as mensagens sejam limpas se não houver
      clearMessages();
      setMessages([]);
    }
    
    return true;
  } catch (err) {
    console.error('[conversationActions] Erro ao carregar mensagens:', err);
    setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar mensagens');
    return false;
  } finally {
    setLoading(false);
  }
};

// Criar uma nova conversa
export const createNewConversation = async (
  setLoading: (loading: boolean) => void,
  addConversation: (conversation: any) => void,
  clearMessages: () => void,
  setError: (error: string | null) => void
) => {
  try {
    console.log('[conversationActions] Criando nova conversa');
    setLoading(true);
    
    // Limpar mensagens para garantir que a interface do usuário seja atualizada
    clearMessages();
    
    // Criar a conversa no banco de dados
    const { data, error, success } = await createConversation();
    
    if (error) {
      console.error('[conversationActions] Erro ao criar conversa:', error);
      setError(error);
      toast.error('Erro ao criar nova conversa');
      return { success: false };
    }
    
    if (data) {
      console.log('[conversationActions] Nova conversa criada:', data.id);
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
    console.error('[conversationActions] Erro ao criar conversa:', err);
    setError(err instanceof Error ? err.message : 'Erro desconhecido ao criar conversa');
    toast.error('Erro ao criar nova conversa');
    return { success: false };
  } finally {
    setLoading(false);
  }
};

// Excluir conversa
export const deleteConversation = async (
  id: string,
  setLoading: (loading: boolean) => void,
  removeConversation: (id: string) => void,
  setError: (error: string | null) => void
) => {
  try {
    if (!id) {
      console.error('[conversationActions] ID de conversa inválido para exclusão');
      setError('ID de conversa inválido');
      return false;
    }
    
    console.log(`[conversationActions] Excluindo conversa: ${id}`);
    
    setLoading(true);
    
    const { error, success } = await deleteConversationFromDB(id);
    
    if (error || !success) {
      console.error('[conversationActions] Erro ao excluir conversa:', error);
      setError(error || 'Erro desconhecido ao excluir conversa');
      toast.error('Erro ao excluir conversa');
      return false;
    }
    
    console.log(`[conversationActions] Conversa ${id} excluída com sucesso`);
    removeConversation(id);
    toast.success('Conversa excluída com sucesso');
    return true;
  } catch (err) {
    console.error('[conversationActions] Erro ao excluir conversa:', err);
    setError(err instanceof Error ? err.message : 'Erro desconhecido ao excluir conversa');
    toast.error('Erro ao excluir conversa');
    return false;
  } finally {
    setLoading(false);
  }
};

// Renomear conversa
export const renameConversation = async (
  id: string,
  newTitle: string,
  setLoading: (loading: boolean) => void,
  updateConversationTitle: (id: string, newTitle: string) => void,
  setError: (error: string | null) => void
) => {
  try {
    if (!id || !newTitle.trim()) {
      console.error('[conversationActions] ID de conversa ou título inválido');
      setError('ID de conversa ou título inválido');
      return false;
    }
    
    console.log(`[conversationActions] Renomeando conversa ${id} para: ${newTitle}`);
    
    setLoading(true);
    
    const { error, success } = await renameConversationFromDB(id, newTitle);
    
    if (error || !success) {
      console.error('[conversationActions] Erro ao renomear conversa:', error);
      setError(error || 'Erro desconhecido ao renomear conversa');
      toast.error('Erro ao renomear conversa');
      return false;
    }
    
    console.log(`[conversationActions] Conversa ${id} renomeada com sucesso`);
    updateConversationTitle(id, newTitle);
    toast.success('Conversa renomeada com sucesso');
    return true;
  } catch (err) {
    console.error('[conversationActions] Erro ao renomear conversa:', err);
    setError(err instanceof Error ? err.message : 'Erro desconhecido ao renomear conversa');
    toast.error('Erro ao renomear conversa');
    return false;
  } finally {
    setLoading(false);
  }
};

// Lidar com atualização de título da conversa
export const handleTitleUpdate = async (
  conversations: ConversationType[],
  updateConversationTitle: (id: string, newTitle: string) => void,
  conversationId: string,
  content: string
): Promise<boolean> => {
  try {
    if (!conversationId || !content.trim()) {
      console.warn('[conversationActions] ID de conversa ou conteúdo inválido para atualização de título');
      return false;
    }
    
    // Verificar se a conversa selecionada está na lista de conversas
    const selectedConversation = conversations.find(
      conv => conv.id === conversationId
    );
    
    if (!selectedConversation) {
      console.warn(`[conversationActions] Não é possível atualizar o título: Conversa ${conversationId} não encontrada`);
      return false;
    }
    
    // Verificar se o título atual é "Nova Conversa"
    if (selectedConversation.title !== 'Nova Conversa') {
      console.log(`[conversationActions] Não atualizando título: O título atual não é o padrão (${selectedConversation.title})`);
      return false;
    }
    
    // Atualizar título com base no conteúdo da mensagem
    const { data, error, success } = await updateConversationTitleInDB(
      conversationId,
      content,
      conversations
    );
    
    if (error || !success) {
      console.error('[conversationActions] Erro ao atualizar título da conversa:', error);
      return false;
    }
    
    if (data?.newTitle) {
      console.log(`[conversationActions] Título da conversa ${conversationId} atualizado para: ${data.newTitle}`);
      updateConversationTitle(conversationId, data.newTitle);
      return true;
    }
    
    return false;
  } catch (err) {
    console.error('[conversationActions] Erro ao atualizar título da conversa:', err);
    return false;
  }
};
