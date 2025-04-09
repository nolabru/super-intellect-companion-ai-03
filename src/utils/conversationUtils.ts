
import { supabase } from '@/integrations/supabase/client';
import { MessageType } from '@/components/ChatMessage';
import { toast } from 'sonner';
import { ConversationType } from '@/types/conversation';

// Save message to database
export const saveMessageToDatabase = async (message: MessageType, conversationId: string) => {
  try {
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
  } catch (err) {
    console.error('Erro ao salvar mensagem:', err);
    // Don't interrupt the flow if it fails to save
  }
};

// Load user conversations
export const loadUserConversations = async () => {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user || !user.user) {
      return { data: null, error: "Usuário não autenticado" }; 
    }
    
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.user.id)
      .order('updated_at', { ascending: false });
      
    if (error) throw error;
    
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
export const loadConversationMessages = async (conversationId: string) => {
  try {
    if (!conversationId) {
      return { data: [], error: null };
    }
    
    console.log(`Carregando mensagens para a conversa ${conversationId}`);
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true });
      
    if (error) throw error;
    
    console.log(`Encontradas ${data?.length || 0} mensagens para a conversa ${conversationId}`);
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
export const createConversation = async () => {
  try {
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
      return { data: data[0], error: null };
    }
    
    return { data: null, error: "Não foi possível criar a conversa" };
  } catch (err) {
    console.error('Erro ao criar conversa:', err);
    toast.error('Erro ao criar nova conversa');
    return { 
      data: null, 
      error: err instanceof Error ? err.message : 'Erro desconhecido ao criar conversa' 
    };
  }
};

// Delete conversation
export const deleteConversation = async (id: string) => {
  try {
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
    return { success: true, error: null };
  } catch (err) {
    console.error('Erro ao excluir conversa:', err);
    toast.error('Erro ao excluir conversa');
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Erro desconhecido ao excluir conversa' 
    };
  }
};

// Rename conversation
export const renameConversation = async (id: string, newTitle: string) => {
  try {
    const { error } = await supabase
      .from('conversations')
      .update({ title: newTitle })
      .match({ id });

    if (error) throw error;
    
    toast.success('Conversa renomeada com sucesso');
    return { success: true, error: null };
  } catch (err) {
    console.error('Erro ao renomear conversa:', err);
    toast.error('Erro ao renomear conversa');
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Erro desconhecido ao renomear conversa' 
    };
  }
};

// Update conversation title based on the first user message
export const updateConversationTitle = async (conversationId: string, content: string, conversations: ConversationType[]) => {
  try {
    // Check if the current title is "Nova Conversa"
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (!conversation || conversation.title !== 'Nova Conversa') {
      return { success: false, error: null }; // Don't update if it's not the default title
    }
    
    // Use the first 30 characters as title or the whole content if smaller
    const newTitle = content.length > 30 
      ? content.substring(0, 30) + '...' 
      : content;
    
    const { error } = await supabase
      .from('conversations')
      .update({ title: newTitle })
      .match({ id: conversationId });

    if (error) throw error;
    
    return { success: true, newTitle, error: null };
  } catch (err) {
    console.error('Erro ao atualizar título da conversa:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Erro desconhecido ao atualizar título'
    };
  }
};
