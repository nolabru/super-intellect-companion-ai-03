import { supabase } from '@/integrations/supabase/client';
import { MessageType } from '@/components/ChatMessage';
import { toast } from 'sonner';
import { ConversationType, DbOperationResult } from '@/types/conversation';

// Save message to database - Improved with better error handling
export const saveMessageToDatabase = async (message: MessageType, conversationId: string): Promise<DbOperationResult> => {
  try {
    if (!conversationId || !message || !message.id) {
      console.error('[conversationUtils] Invalid parameters to save message');
      return { 
        data: null, 
        error: 'Invalid parameters to save message',
        success: false
      };
    }
    
    console.log(`[conversationUtils] Saving message ${message.id} to conversation ${conversationId}`);
    
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
      console.error('[conversationUtils] Error saving message:', error);
      throw error;
    }
    
    // Update conversation timestamp to move it to the top of the list
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);
      
    if (updateError) {
      console.warn('[conversationUtils] Error updating conversation timestamp:', updateError);
      // Continue even if timestamp update fails
    }
    
    console.log(`[conversationUtils] Message ${message.id} saved successfully`);
    return { data: message, error: null, success: true };
  } catch (err) {
    console.error('[conversationUtils] Error saving message:', err);
    // Don't interrupt the flow if it fails to save
    return { 
      data: null, 
      error: err instanceof Error ? err.message : 'Unknown error saving message',
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
      console.log(`[conversationUtils] Loading user conversations (attempt ${attempt + 1}/${maxRetries + 1})`);
      
      const { data: user } = await supabase.auth.getUser();
      
      if (!user || !user.user) {
        console.log('[conversationUtils] No authenticated user found');
        return { data: [], error: null }; 
      }
      
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.user.id)
        .order('updated_at', { ascending: false });
        
      if (error) {
        console.error('[conversationUtils] Error fetching conversations:', error);
        throw error;
      }
      
      console.log(`[conversationUtils] Loaded ${data?.length || 0} conversations`);
      return { data: data || [], error: null };
    } catch (err) {
      console.error(`[conversationUtils] Error loading conversations (attempt ${attempt + 1}):`, err);
      
      // If we've reached max retries, return the error
      if (attempt === maxRetries) {
        return { 
          data: [], 
          error: err instanceof Error ? err.message : 'Unknown error loading conversations' 
        };
      }
      
      // Otherwise, wait and retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      attempt++;
    }
  }
  
  // This should never be reached due to the return in the catch block
  return { data: [], error: 'Unknown error loading conversations after multiple attempts' };
};

// Load conversation messages - Improved with retry mechanism
export const loadConversationMessages = async (conversationId: string): Promise<DbOperationResult> => {
  const maxRetries = 2;
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      if (!conversationId) {
        console.log('[conversationUtils] No conversation ID provided, returning empty array of messages');
        return { data: [], error: null };
      }
      
      console.log(`[conversationUtils] Loading messages for conversation ${conversationId} (attempt ${attempt + 1}/${maxRetries + 1})`);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });
        
      if (error) {
        console.error('[conversationUtils] Error fetching messages:', error);
        throw error;
      }
      
      console.log(`[conversationUtils] Found ${data?.length || 0} messages for conversation ${conversationId}`);
      return { data: data || [], error: null };
    } catch (err) {
      console.error(`[conversationUtils] Error loading messages (attempt ${attempt + 1}):`, err);
      
      // If we've reached max retries, return the error
      if (attempt === maxRetries) {
        return { 
          data: [], 
          error: err instanceof Error ? err.message : 'Unknown error loading messages' 
        };
      }
      
      // Otherwise, wait and retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      attempt++;
    }
  }
  
  // This should never be reached due to the return in the catch block
  return { data: [], error: 'Unknown error loading messages after multiple attempts' };
};

// Create a new conversation - Improved with better validation
export const createConversation = async (): Promise<DbOperationResult<ConversationType>> => {
  try {
    console.log('[conversationUtils] Creating new conversation');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('[conversationUtils] Error getting user:', userError);
      throw userError;
    }
    
    if (!userData.user) {
      console.error('[conversationUtils] User is not authenticated');
      throw new Error("User is not authenticated");
    }
    
    const { data, error } = await supabase
      .from('conversations')
      .insert([
        { title: 'Nova Conversa', user_id: userData.user.id }
      ])
      .select();

    if (error) {
      console.error('[conversationUtils] Error creating conversation:', error);
      throw error;
    }
    
    if (data && data.length > 0) {
      console.log('[conversationUtils] New conversation created:', data[0].id);
      toast.success('Nova conversa criada');
      return { data: data[0], error: null, success: true };
    }
    
    console.error('[conversationUtils] No data returned from conversation creation');
    return { data: null, error: "Could not create conversation", success: false };
  } catch (err) {
    console.error('[conversationUtils] Error creating conversation:', err);
    toast.error('Erro ao criar nova conversa');
    return { 
      data: null, 
      error: err instanceof Error ? err.message : 'Unknown error creating conversation',
      success: false
    };
  }
};

// Delete conversation with transaction - Improved for reliability
export const deleteConversation = async (id: string): Promise<DbOperationResult> => {
  try {
    if (!id) {
      console.error('[conversationUtils] Invalid conversation ID for deletion');
      return { success: false, error: 'Invalid conversation ID', data: null };
    }
    
    console.log(`[conversationUtils] Deleting conversation ${id}`);
    
    // Use a transaction to ensure atomic operation - Fix TypeScript error by using a raw call
    const { error: transactionError } = await supabase.rpc(
      'delete_conversation_with_messages' as any, 
      { conversation_id: id }
    );
    
    if (transactionError) {
      console.error('[conversationUtils] Transaction error deleting conversation:', transactionError);
      
      // Fallback to separate operations if transaction fails
      console.log('[conversationUtils] Falling back to separate delete operations');
      
      // First delete all associated messages
      try {
        const { error: messagesError } = await supabase
          .from('messages')
          .delete()
          .match({ conversation_id: id });
          
        if (messagesError) {
          console.error('[conversationUtils] Error deleting conversation messages:', messagesError);
          // Continue with deletion even if message deletion fails
        }
      } catch (messagesErr) {
        console.error('[conversationUtils] Error deleting messages:', messagesErr);
        // Continue with conversation deletion even if message deletion fails
      }
      
      // Allow some time between operations
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Then delete the conversation
      const { error } = await supabase
        .from('conversations')
        .delete()
        .match({ id });

      if (error) {
        console.error('[conversationUtils] Error deleting conversation:', error);
        throw error;
      }
    }
    
    console.log(`[conversationUtils] Conversation ${id} deleted successfully`);
    toast.success('Conversa excluída com sucesso');
    
    // Force a small delay to ensure UI can update properly before redirecting
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { data: null, error: null, success: true };
  } catch (err) {
    console.error('[conversationUtils] Error deleting conversation:', err);
    toast.error('Erro ao excluir conversa');
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error deleting conversation',
      data: null
    };
  }
};

// Rename conversation - Improved with input validation
export const renameConversation = async (id: string, newTitle: string): Promise<DbOperationResult> => {
  try {
    if (!id || !newTitle || newTitle.trim() === '') {
      console.error('[conversationUtils] Invalid conversation ID or title for renaming');
      return { success: false, error: 'Invalid conversation ID or title', data: null };
    }
    
    // Remove excessive whitespace and trim
    const cleanedTitle = newTitle.trim().replace(/\s+/g, ' ');
    
    console.log(`[conversationUtils] Renaming conversation ${id} to "${cleanedTitle}"`);
    const { error } = await supabase
      .from('conversations')
      .update({ title: cleanedTitle })
      .match({ id });

    if (error) {
      console.error('[conversationUtils] Error renaming conversation:', error);
      throw error;
    }
    
    console.log(`[conversationUtils] Conversation ${id} renamed successfully`);
    toast.success('Conversa renomeada com sucesso');
    return { success: true, error: null, data: null };
  } catch (err) {
    console.error('[conversationUtils] Error renaming conversation:', err);
    toast.error('Erro ao renomear conversa');
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error renaming conversation',
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
      console.error('[conversationUtils] Invalid conversation ID or content for title update');
      return { success: false, error: 'Invalid parameters', data: null };
    }
    
    // Check if the current title is "Nova Conversa"
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (!conversation) {
      console.log(`[conversationUtils] Conversation ${conversationId} not found in state`);
      return { success: false, error: null, data: null };
    }
    
    if (conversation.title !== 'Nova Conversa') {
      console.log(`[conversationUtils] Not updating title because it's not the default title (current: "${conversation.title}")`);
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
    
    console.log(`[conversationUtils] Updating conversation ${conversationId} title to "${newTitle}"`);
    
    const { error } = await supabase
      .from('conversations')
      .update({ title: newTitle })
      .match({ id: conversationId });

    if (error) {
      console.error('[conversationUtils] Error updating conversation title:', error);
      throw error;
    }
    
    console.log(`[conversationUtils] Conversation ${conversationId} title updated successfully`);
    return { success: true, data: { newTitle }, error: null };
  } catch (err) {
    console.error('[conversationUtils] Error updating conversation title:', err);
    return { 
      success: false, 
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error updating title'
    };
  }
};
