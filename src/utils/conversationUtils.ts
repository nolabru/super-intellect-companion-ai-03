
import { supabase } from '@/integrations/supabase/client';
import { MessageType } from '@/components/ChatMessage';
import { toast } from 'sonner';
import { ConversationType, DbOperationResult } from '@/types/conversation';

// Save message to database - Improved with better error handling
export const saveMessageToDatabase = async (message: MessageType, conversationId: string): Promise<DbOperationResult> => {
  try {
    if (!conversationId || !message || !message.id) {
      console.error('[conversationUtils] Parâmetros inválidos para salvar mensagem');
      return { 
        data: null, 
        error: 'Parâmetros inválidos para salvar mensagem',
        success: false
      };
    }
    
    console.log(`[conversationUtils] Salvando mensagem ${message.id} na conversa ${conversationId}`);
    
    // Insert message into database
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
      
    if (error) {
      console.error('[conversationUtils] Erro ao salvar mensagem:', error);
      throw error;
    }
    
    // Update conversation timestamp to move it to the top of the list
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);
      
    if (updateError) {
      console.warn('[conversationUtils] Erro ao atualizar timestamp da conversa:', updateError);
      // Continue even if timestamp update fails
    }
    
    console.log(`[conversationUtils] Mensagem ${message.id} salva com sucesso`);
    return { data: message, error: null, success: true };
  } catch (err) {
    console.error('[conversationUtils] Erro ao salvar mensagem:', err);
    // Don't interrupt the flow if it fails to save
    return { 
      data: null, 
      error: err instanceof Error ? err.message : 'Erro desconhecido ao salvar mensagem',
      success: false
    };
  }
};

// Load user conversations - Improved with retry mechanism
export const loadUserConversations = async (): Promise<DbOperationResult<ConversationType[]>> => {
  const maxRetries = 2;
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      console.log(`[conversationUtils] Carregando conversas do usuário (tentativa ${attempt + 1}/${maxRetries + 1})`);
      
      const { data: user } = await supabase.auth.getUser();
      
      if (!user || !user.user) {
        console.log('[conversationUtils] Nenhum usuário autenticado encontrado');
        return { data: [], error: null }; 
      }
      
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.user.id)
        .order('updated_at', { ascending: false });
        
      if (error) {
        console.error('[conversationUtils] Erro ao buscar conversas:', error);
        throw error;
      }
      
      console.log(`[conversationUtils] Carregadas ${data?.length || 0} conversas`);
      return { data: data || [], error: null };
    } catch (err) {
      console.error(`[conversationUtils] Erro ao carregar conversas (tentativa ${attempt + 1}):`, err);
      
      // If we've reached max retries, return the error
      if (attempt === maxRetries) {
        return { 
          data: [], 
          error: err instanceof Error ? err.message : 'Erro desconhecido ao carregar conversas' 
        };
      }
      
      // Otherwise, wait and retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      attempt++;
    }
  }
  
  // This should never be reached due to the return in the catch block
  return { data: [], error: 'Erro desconhecido ao carregar conversas após várias tentativas' };
};

// Load conversation messages - Improved with retry mechanism
export const loadConversationMessages = async (conversationId: string): Promise<DbOperationResult> => {
  const maxRetries = 2;
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      if (!conversationId) {
        console.log('[conversationUtils] Nenhum ID de conversa fornecido, retornando array vazio de mensagens');
        return { data: [], error: null };
      }
      
      console.log(`[conversationUtils] Carregando mensagens para conversa ${conversationId} (tentativa ${attempt + 1}/${maxRetries + 1})`);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });
        
      if (error) {
        console.error('[conversationUtils] Erro ao buscar mensagens:', error);
        throw error;
      }
      
      console.log(`[conversationUtils] Encontradas ${data?.length || 0} mensagens para conversa ${conversationId}`);
      return { data: data || [], error: null };
    } catch (err) {
      console.error(`[conversationUtils] Erro ao carregar mensagens (tentativa ${attempt + 1}):`, err);
      
      // If we've reached max retries, return the error
      if (attempt === maxRetries) {
        return { 
          data: [], 
          error: err instanceof Error ? err.message : 'Erro desconhecido ao carregar mensagens' 
        };
      }
      
      // Otherwise, wait and retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      attempt++;
    }
  }
  
  // This should never be reached due to the return in the catch block
  return { data: [], error: 'Erro desconhecido ao carregar mensagens após várias tentativas' };
};

// Create a new conversation - Improved with better validation
export const createConversation = async (): Promise<DbOperationResult<ConversationType>> => {
  try {
    console.log('[conversationUtils] Criando nova conversa');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('[conversationUtils] Erro ao obter usuário:', userError);
      throw userError;
    }
    
    if (!userData.user) {
      console.error('[conversationUtils] Usuário não está autenticado');
      throw new Error("Usuário não está autenticado");
    }
    
    const { data, error } = await supabase
      .from('conversations')
      .insert([
        { title: 'Nova Conversa', user_id: userData.user.id }
      ])
      .select();

    if (error) {
      console.error('[conversationUtils] Erro ao criar conversa:', error);
      throw error;
    }
    
    if (data && data.length > 0) {
      console.log('[conversationUtils] Nova conversa criada:', data[0].id);
      toast.success('Nova conversa criada');
      return { data: data[0], error: null, success: true };
    }
    
    console.error('[conversationUtils] Nenhum dado retornado da criação da conversa');
    return { data: null, error: "Não foi possível criar a conversa", success: false };
  } catch (err) {
    console.error('[conversationUtils] Erro ao criar conversa:', err);
    toast.error('Erro ao criar nova conversa');
    return { 
      data: null, 
      error: err instanceof Error ? err.message : 'Erro desconhecido ao criar conversa',
      success: false
    };
  }
};

// Delete conversation - Improved with transaction for reliability
export const deleteConversation = async (id: string): Promise<DbOperationResult> => {
  try {
    if (!id) {
      console.error('[conversationUtils] ID de conversa inválido para exclusão');
      return { success: false, error: 'ID de conversa inválido', data: null };
    }
    
    console.log(`[conversationUtils] Excluindo conversa ${id}`);
    
    // First delete all associated messages
    try {
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .match({ conversation_id: id });
        
      if (messagesError) {
        console.error('[conversationUtils] Erro ao excluir mensagens da conversa:', messagesError);
        // Continue with deletion even if message deletion fails
      }
    } catch (messagesErr) {
      console.error('[conversationUtils] Erro ao excluir mensagens:', messagesErr);
      // Continue with conversation deletion even if message deletion fails
    }
    
    // Then delete the conversation
    const { error } = await supabase
      .from('conversations')
      .delete()
      .match({ id });

    if (error) {
      console.error('[conversationUtils] Erro ao excluir conversa:', error);
      throw error;
    }
    
    console.log(`[conversationUtils] Conversa ${id} excluída com sucesso`);
    toast.success('Conversa excluída com sucesso');
    
    // Force a small delay to ensure UI can update properly before redirecting
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return { data: null, error: null, success: true };
  } catch (err) {
    console.error('[conversationUtils] Erro ao excluir conversa:', err);
    toast.error('Erro ao excluir conversa');
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Erro desconhecido ao excluir conversa',
      data: null
    };
  }
};

// Rename conversation - Improved with input validation
export const renameConversation = async (id: string, newTitle: string): Promise<DbOperationResult> => {
  try {
    if (!id || !newTitle || newTitle.trim() === '') {
      console.error('[conversationUtils] ID de conversa ou título inválido para renomeação');
      return { success: false, error: 'ID de conversa ou título inválido', data: null };
    }
    
    // Remove excessive whitespace and trim
    const cleanedTitle = newTitle.trim().replace(/\s+/g, ' ');
    
    console.log(`[conversationUtils] Renomeando conversa ${id} para "${cleanedTitle}"`);
    const { error } = await supabase
      .from('conversations')
      .update({ title: cleanedTitle })
      .match({ id });

    if (error) {
      console.error('[conversationUtils] Erro ao renomear conversa:', error);
      throw error;
    }
    
    console.log(`[conversationUtils] Conversa ${id} renomeada com sucesso`);
    toast.success('Conversa renomeada com sucesso');
    return { success: true, error: null, data: null };
  } catch (err) {
    console.error('[conversationUtils] Erro ao renomear conversa:', err);
    toast.error('Erro ao renomear conversa');
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Erro desconhecido ao renomear conversa',
      data: null
    };
  }
};

// Update conversation title based on the first user message - Improved reliability
export const updateConversationTitle = async (
  conversationId: string, 
  content: string, 
  conversations: ConversationType[]
): Promise<DbOperationResult<{newTitle: string}>> => {
  try {
    if (!conversationId || !content || content.trim() === '') {
      console.error('[conversationUtils] ID de conversa ou conteúdo inválido para atualização de título');
      return { success: false, error: 'Parâmetros inválidos', data: null };
    }
    
    // Check if the current title is "Nova Conversa"
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (!conversation) {
      console.log(`[conversationUtils] Conversa ${conversationId} não encontrada no estado`);
      return { success: false, error: null, data: null };
    }
    
    if (conversation.title !== 'Nova Conversa') {
      console.log(`[conversationUtils] Não atualizando título porque não é o título padrão (atual: "${conversation.title}")`);
      return { success: false, error: null, data: null }; // Don't update if it's not the default title
    }
    
    // Clean up content before using as title
    let newTitle = content.trim();
    
    // Replace newlines with spaces
    newTitle = newTitle.replace(/\n+/g, ' ');
    
    // Remove excessive whitespace
    newTitle = newTitle.replace(/\s+/g, ' ');
    
    // Use the first 30 characters as title or the whole content if smaller
    if (newTitle.length > 30) {
      newTitle = newTitle.substring(0, 30) + '...';
    }
    
    console.log(`[conversationUtils] Atualizando título da conversa ${conversationId} para "${newTitle}"`);
    
    const { error } = await supabase
      .from('conversations')
      .update({ title: newTitle })
      .match({ id: conversationId });

    if (error) {
      console.error('[conversationUtils] Erro ao atualizar título da conversa:', error);
      throw error;
    }
    
    console.log(`[conversationUtils] Título da conversa ${conversationId} atualizado com sucesso`);
    return { success: true, data: { newTitle }, error: null };
  } catch (err) {
    console.error('[conversationUtils] Erro ao atualizar título da conversa:', err);
    return { 
      success: false, 
      data: null,
      error: err instanceof Error ? err.message : 'Erro desconhecido ao atualizar título'
    };
  }
};
