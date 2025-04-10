
import { useState, useEffect, useCallback } from 'react';
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

  // Improved load user conversations function with better error handling
  const fetchConversations = useCallback(async () => {
    try {
      console.log('[useConversationState] Carregando conversas do usuário');
      setConversationState(prev => ({ ...prev, loading: true }));
      
      const { data, error: fetchError } = await loadUserConversations();
      
      if (fetchError) {
        console.error('[useConversationState] Erro ao carregar conversas:', fetchError);
        toast.error(`Erro ao carregar conversas: ${fetchError}`);
        setConversationState(prev => ({ ...prev, error: fetchError, loading: false }));
        return;
      }
      
      if (data) {
        console.log(`[useConversationState] Carregadas ${data.length} conversas`);
        
        // Select most recent conversation if none is selected and there are conversations available
        const updatedState: Partial<ConversationState> = { 
          conversations: data, 
          loading: false,
          error: null
        };
        
        if (!conversationState.currentConversationId && data.length > 0) {
          console.log(`[useConversationState] Auto-selecionando a conversa mais recente: ${data[0].id}`);
          updatedState.currentConversationId = data[0].id;
        }
        
        setConversationState(prev => ({ ...prev, ...updatedState }));
      } else {
        setConversationState(prev => ({ ...prev, loading: false, error: null }));
      }
    } catch (err) {
      console.error('[useConversationState] Erro ao carregar conversas:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar conversas';
      toast.error(`Erro ao carregar conversas: ${errorMessage}`);
      setConversationState(prev => ({ ...prev, error: errorMessage, loading: false }));
    }
  }, [conversationState.currentConversationId]);

  // Load user conversations on component mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const setLoading = (loading: boolean) => {
    setConversationState(prev => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setConversationState(prev => ({ ...prev, error }));
  };

  const setCurrentConversationId = (id: string | null) => {
    console.log(`[useConversationState] Definindo ID de conversa atual: ${id || 'null'}`);
    setConversationState(prev => ({ ...prev, currentConversationId: id }));
  };

  const updateConversations = (conversations: ConversationType[]) => {
    setConversationState(prev => ({ ...prev, conversations }));
  };

  const addConversation = (conversation: ConversationType) => {
    console.log(`[useConversationState] Adicionando nova conversa: ${conversation.id}`);
    setConversationState(prev => ({
      ...prev,
      currentConversationId: conversation.id,
      conversations: [conversation, ...prev.conversations]
    }));
  };

  const updateConversationTitle = (id: string, newTitle: string) => {
    console.log(`[useConversationState] Atualizando título da conversa ${id} para: ${newTitle}`);
    setConversationState(prev => ({
      ...prev,
      conversations: prev.conversations.map(conv => 
        conv.id === id ? { ...conv, title: newTitle } : conv
      )
    }));
  };

  const removeConversation = (id: string) => {
    console.log(`[useConversationState] Removendo conversa: ${id}`);
    setConversationState(prev => {
      const updatedState: Partial<ConversationState> = {
        conversations: prev.conversations.filter(conv => conv.id !== id)
      };
      
      if (prev.currentConversationId === id) {
        const remainingConversations = prev.conversations.filter(conv => conv.id !== id);
        
        if (remainingConversations.length > 0) {
          console.log(`[useConversationState] Conversando atual excluída, selecionando outra: ${remainingConversations[0].id}`);
          updatedState.currentConversationId = remainingConversations[0].id;
        } else {
          console.log('[useConversationState] Não há mais conversas, definindo ID atual como null');
          updatedState.currentConversationId = null;
        }
      }
      
      return { ...prev, ...updatedState };
    });
  };

  // Force refresh conversations from database
  const refreshConversations = useCallback(() => {
    console.log('[useConversationState] Forçando atualização das conversas');
    fetchConversations();
  }, [fetchConversations]);

  return {
    ...conversationState,
    setLoading,
    setError,
    setCurrentConversationId,
    updateConversations,
    addConversation,
    updateConversationTitle,
    removeConversation,
    refreshConversations
  };
}
