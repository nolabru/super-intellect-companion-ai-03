
import { supabase } from '@/integrations/supabase/client';
import { MessageType } from '@/components/ChatMessage';
import { toast } from 'sonner';
import { ConversationType, DbOperationResult } from '@/types/conversation';

// Save message to database
export const saveMessageToDatabase = async (message: MessageType, conversationId: string): Promise<DbOperationResult> => {
  try {
    console.log(`Saving message to database for conversation ${conversationId}`, message.id);
    
    const { error } = await supabase
      .from('messages')
      .insert([{
        id: message.id,
        content: message.content,
        sender: message.sender,
        timestamp: message.timestamp,
        conversation_id: conversationId,
        model: message.model,
        mode: message.mode,
        files: message.files || null,
        media_url: message.mediaUrl || null
      }]);
      
    if (error) throw error;
    return { data: message, error: null, success: true };
  } catch (err) {
    console.error('Erro ao salvar mensagem:', err);
    // Don't interrupt the flow if it fails to save
    return { 
      data: null, 
      error: err instanceof Error ? err.message : 'Erro desconhecido ao salvar mensagem',
      success: false
    };
  }
};

// Load user conversations
export const loadUserConversations = async (): Promise<DbOperationResult<ConversationType[]>> => {
  try {
    console.log('Loading user conversations');
    const { data: user } = await supabase.auth.getUser();
    
    if (!user || !user.user) {
      return { data: [], error: "Usuário não autenticado" }; 
    }
    
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.user.id)
      .order('updated_at', { ascending: false });
      
    if (error) throw error;
    
    console.log(`Loaded ${data?.length || 0} conversations`);
    return { data, error: null };
  } catch (err) {
    console.error('Erro ao carregar conversas:', err);
    return { 
      data: null, 
      error: err instanceof Error ? err.message : 'Erro desconhecido ao carregar conversas' 
    };
  }
};

// Load conversation messages
export const loadConversationMessages = async (conversationId: string): Promise<DbOperationResult> => {
  try {
    if (!conversationId) {
      console.log('No conversation ID provided, returning empty messages array');
      return { data: [], error: null };
    }
    
    console.log(`Loading messages for conversation ${conversationId}`);
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true });
      
    if (error) throw error;
    
    console.log(`Found ${data?.length || 0} messages for conversation ${conversationId}`);
    return { data, error: null };
  } catch (err) {
    console.error('Erro ao carregar mensagens:', err);
    return { 
      data: null, 
      error: err instanceof Error ? err.message : 'Erro desconhecido ao carregar mensagens' 
    };
  }
};

// Create a new conversation
export const createConversation = async (): Promise<DbOperationResult<ConversationType>> => {
  try {
    console.log('Creating new conversation');
    const user = await supabase.auth.getUser();
    
    if (!user.data.user) {
      throw new Error("User is not authenticated");
    }
    
    const { data, error } = await supabase
      .from('conversations')
      .insert([
        { title: 'Nova Conversa', user_id: user.data.user.id }
      ])
      .select();

    if (error) throw error;
    
    if (data && data.length > 0) {
      toast.success('Nova conversa criada');
      console.log('New conversation created:', data[0].id);
      return { data: data[0], error: null, success: true };
    }
    
    return { data: null, error: "Não foi possível criar a conversa", success: false };
  } catch (err) {
    console.error('Erro ao criar conversa:', err);
    toast.error('Erro ao criar nova conversa');
    return { 
      data: null, 
      error: err instanceof Error ? err.message : 'Erro desconhecido ao criar conversa',
      success: false
    };
  }
};

// Delete conversation
export const deleteConversation = async (id: string): Promise<DbOperationResult> => {
  try {
    console.log(`Deleting conversation ${id}`);
    // First delete all associated messages
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .match({ conversation_id: id });
      
    if (messagesError) throw messagesError;
    
    // Then delete the conversation
    const { error } = await supabase
      .from('conversations')
      .delete()
      .match({ id });

    if (error) throw error;
    
    toast.success('Conversa excluída com sucesso');
    return { data: null, error: null, success: true };
  } catch (err) {
    console.error('Erro ao excluir conversa:', err);
    toast.error('Erro ao excluir conversa');
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Erro desconhecido ao excluir conversa',
      data: null
    };
  }
};

// Rename conversation
export const renameConversation = async (id: string, newTitle: string): Promise<DbOperationResult> => {
  try {
    console.log(`Renaming conversation ${id} to "${newTitle}"`);
    const { error } = await supabase
      .from('conversations')
      .update({ title: newTitle })
      .match({ id });

    if (error) throw error;
    
    toast.success('Conversa renomeada com sucesso');
    return { success: true, error: null, data: null };
  } catch (err) {
    console.error('Erro ao renomear conversa:', err);
    toast.error('Erro ao renomear conversa');
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Erro desconhecido ao renomear conversa',
      data: null
    };
  }
};

// Update conversation title based on the first user message
export const updateConversationTitle = async (
  conversationId: string, 
  content: string, 
  conversations: ConversationType[]
): Promise<DbOperationResult<{newTitle: string}>> => {
  try {
    // Check if the current title is "Nova Conversa"
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (!conversation || conversation.title !== 'Nova Conversa') {
      console.log('Not updating title because it\'s not the default title');
      return { success: false, error: null, data: null }; // Don't update if it's not the default title
    }
    
    // Use the first 30 characters as title or the whole content if smaller
    const newTitle = content.length > 30 
      ? content.substring(0, 30) + '...' 
      : content;
    
    console.log(`Updating conversation ${conversationId} title to "${newTitle}"`);
    
    const { error } = await supabase
      .from('conversations')
      .update({ title: newTitle })
      .match({ id: conversationId });

    if (error) throw error;
    
    return { success: true, data: { newTitle }, error: null };
  } catch (err) {
    console.error('Erro ao atualizar título da conversa:', err);
    return { 
      success: false, 
      data: null,
      error: err instanceof Error ? err.message : 'Erro desconhecido ao atualizar título'
    };
  }
};
