
import { v4 as uuidv4 } from 'uuid';
import { MessageType } from '@/components/ChatMessage';
import { LumaParams } from '@/components/LumaParamsButton';
import { ChatMode } from '@/components/ModeSelector';
import { 
  createConversation, 
  deleteConversation as deleteConversationUtil, 
  renameConversation as renameConversationUtil,
  updateConversationTitle as updateConversationTitleUtil,
  loadConversationMessages
} from '@/utils/conversationUtils';
import { ConversationType } from '@/types/conversation';

// Create a new conversation
export const createNewConversation = async (
  setLoading: (loading: boolean) => void,
  addConversation: (conversation: ConversationType) => void,
  clearMessages: () => void,
  setError: (error: string | null) => void
) => {
  try {
    setLoading(true);
    
    console.log('[conversationActions] Creating new conversation, clearing messages first');
    clearMessages();
    
    const { data, error: createError, success } = await createConversation();
    
    if (createError) {
      console.error('[conversationActions] Error creating conversation:', createError);
      setError(createError);
      return false;
    }
    
    if (data && success) {
      console.log(`[conversationActions] New conversation created with ID: ${data.id}`);
      addConversation(data);
      clearMessages(); // Clear messages again to ensure they're reset
      return true;
    }
    
    return false;
  } catch (err) {
    console.error('[conversationActions] Error creating conversation:', err);
    setError(err instanceof Error ? err.message : 'Erro desconhecido ao criar nova conversa');
    return false;
  } finally {
    setLoading(false);
  }
};

// Delete a conversation
export const deleteConversation = async (
  id: string,
  setLoading: (loading: boolean) => void,
  removeConversation: (id: string) => void,
  setError: (error: string | null) => void
) => {
  try {
    setLoading(true);
    
    const { success, error: deleteError } = await deleteConversationUtil(id);
    
    if (deleteError) {
      console.error('[conversationActions] Error deleting conversation:', deleteError);
      setError(deleteError);
      return false;
    }
    
    if (success) {
      console.log(`[conversationActions] Conversation ${id} deleted successfully`);
      removeConversation(id);
      return true;
    }
    
    return false;
  } catch (err) {
    console.error('[conversationActions] Error deleting conversation:', err);
    setError(err instanceof Error ? err.message : 'Erro desconhecido ao excluir conversa');
    return false;
  } finally {
    setLoading(false);
  }
};

// Rename a conversation
export const renameConversation = async (
  id: string,
  newTitle: string,
  setLoading: (loading: boolean) => void,
  updateConversationTitle: (id: string, newTitle: string) => void,
  setError: (error: string | null) => void
) => {
  try {
    setLoading(true);
    
    const { success, error: renameError } = await renameConversationUtil(id, newTitle);
    
    if (renameError) {
      console.error('[conversationActions] Error renaming conversation:', renameError);
      setError(renameError);
      return false;
    }
    
    if (success) {
      console.log(`[conversationActions] Conversation ${id} renamed to "${newTitle}"`);
      updateConversationTitle(id, newTitle);
      return true;
    }
    
    return false;
  } catch (err) {
    console.error('[conversationActions] Error renaming conversation:', err);
    setError(err instanceof Error ? err.message : 'Erro desconhecido ao renomear conversa');
    return false;
  } finally {
    setLoading(false);
  }
};

// Load messages for a conversation
export const loadMessages = async (
  conversationId: string | null,
  setLoading: (loading: boolean) => void,
  setMessages: (messages: MessageType[]) => void,
  clearMessages: () => void,
  setError: (error: string | null) => void
) => {
  if (!conversationId) {
    console.log('[conversationActions] No conversation selected, clearing messages');
    clearMessages();
    return;
  }
  
  try {
    setLoading(true);
    console.log(`[conversationActions] Loading messages for conversation: ${conversationId}`);
    
    const { data, error: fetchError } = await loadConversationMessages(conversationId);
    
    if (fetchError) {
      console.error('[conversationActions] Error loading messages:', fetchError);
      setError(fetchError);
      return;
    }
    
    if (data) {
      // Convert database data to MessageType format
      const formattedMessages: MessageType[] = data.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender as 'user' | 'assistant',
        timestamp: msg.timestamp,
        model: msg.model,
        mode: msg.mode as ChatMode,
        files: msg.files || [],
        mediaUrl: msg.media_url || undefined
      }));
      
      console.log(`[conversationActions] Setting ${formattedMessages.length} messages from conversation ${conversationId}`);
      setMessages(formattedMessages);
    } else {
      console.log('[conversationActions] No messages found, clearing message state');
      clearMessages();
    }
  } catch (err) {
    console.error('[conversationActions] Error fetching messages:', err);
    setError(err instanceof Error ? err.message : 'Erro desconhecido ao buscar mensagens');
  } finally {
    setLoading(false);
  }
};

// Update conversation title based on message content
export const handleTitleUpdate = async (
  conversations: ConversationType[],
  updateConversationTitle: (id: string, newTitle: string) => void,
  conversationId: string,
  content: string
) => {
  const result = await updateConversationTitleUtil(conversationId, content, conversations);
  
  if (result.success && result.data && 'newTitle' in result.data) {
    const newTitle = result.data.newTitle;
    console.log(`[conversationActions] Updated conversation title to "${newTitle}"`);
    updateConversationTitle(conversationId, newTitle);
    return true;
  }
  
  return false;
};
