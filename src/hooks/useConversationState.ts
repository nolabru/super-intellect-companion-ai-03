
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ConversationType, ConversationState } from '@/types/conversation';
import { loadUserConversations } from '@/utils/conversationUtils';

export function useConversationState() {
  const [conversationState, setConversationState] = useState<ConversationState>({
    conversations: [],
    currentConversationId: null,
    loading: false,
    error: null
  });

  // Load user conversations on init
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setConversationState(prev => ({ ...prev, loading: true }));
        const { data, error: fetchError } = await loadUserConversations();
        
        if (fetchError) {
          console.error('[useConversationState] Error loading conversations:', fetchError);
          setConversationState(prev => ({ ...prev, error: fetchError }));
          return;
        }
        
        if (data) {
          console.log(`[useConversationState] Loaded ${data.length} conversations`);
          
          // Select most recent conversation if none is selected and there are conversations available
          const updatedState: Partial<ConversationState> = { conversations: data };
          
          if (!conversationState.currentConversationId && data.length > 0) {
            console.log(`[useConversationState] Auto-selecting the most recent conversation: ${data[0].id}`);
            updatedState.currentConversationId = data[0].id;
          }
          
          setConversationState(prev => ({ ...prev, ...updatedState }));
        }
      } catch (err) {
        console.error('[useConversationState] Error loading conversations:', err);
        setConversationState(prev => ({ 
          ...prev, 
          error: err instanceof Error ? err.message : 'Erro desconhecido ao buscar conversas'
        }));
      } finally {
        setConversationState(prev => ({ ...prev, loading: false }));
      }
    };
    
    fetchConversations();
  }, []);

  const setLoading = (loading: boolean) => {
    setConversationState(prev => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setConversationState(prev => ({ ...prev, error }));
  };

  const setCurrentConversationId = (id: string | null) => {
    setConversationState(prev => ({ ...prev, currentConversationId: id }));
  };

  const updateConversations = (conversations: ConversationType[]) => {
    setConversationState(prev => ({ ...prev, conversations }));
  };

  const addConversation = (conversation: ConversationType) => {
    setConversationState(prev => ({
      ...prev,
      currentConversationId: conversation.id,
      conversations: [conversation, ...prev.conversations]
    }));
  };

  const updateConversationTitle = (id: string, newTitle: string) => {
    setConversationState(prev => ({
      ...prev,
      conversations: prev.conversations.map(conv => 
        conv.id === id ? { ...conv, title: newTitle } : conv
      )
    }));
  };

  const removeConversation = (id: string) => {
    setConversationState(prev => {
      const updatedState: Partial<ConversationState> = {
        conversations: prev.conversations.filter(conv => conv.id !== id)
      };
      
      if (prev.currentConversationId === id) {
        const remainingConversations = prev.conversations.filter(conv => conv.id !== id);
        
        if (remainingConversations.length > 0) {
          updatedState.currentConversationId = remainingConversations[0].id;
        } else {
          updatedState.currentConversationId = null;
        }
      }
      
      return { ...prev, ...updatedState };
    });
  };

  return {
    ...conversationState,
    setLoading,
    setError,
    setCurrentConversationId,
    updateConversations,
    addConversation,
    updateConversationTitle,
    removeConversation
  };
}
