import { useConversationState } from './useConversationState';
import { useConversationMessages } from './useConversationMessages';
import { useMessageHandler } from './useMessageHandler';
import { useConversationNavigation } from './useConversationNavigation';
import {
  createNewConversation,
  deleteConversation,
  renameConversation,
  loadMessages,
  handleTitleUpdate
} from './conversationActions';
import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export function useConversation() {
  const conversationState = useConversationState();
  const messagesState = useConversationMessages();
  const navigate = useNavigate();
  
  // Flag para prevenir múltiplas operações de carregamento simultâneas
  const loadingRef = useRef(false);
  // Rastrear se o carregamento inicial foi realizado
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  // Rastrear o último ID de conversa carregado para evitar carregamentos redundantes
  const lastLoadedConversationRef = useRef<string | null>(null);
  // Flag to prevent multiple conversation deletion operations
  const deletingRef = useRef(false);
  
  const { 
    conversations,
    currentConversationId,
    loading,
    error,
    setLoading,
    setError,
    setCurrentConversationId,
    updateConversations,
    addConversation,
    updateConversationTitle,
    removeConversation
  } = conversationState;
  
  const {
    messages,
    setMessages,
    clearMessages,
    addUserMessage,
    addAssistantMessage,
    addErrorMessage,
    saveUserMessage,
    removeLoadingMessages
  } = messagesState;

  // Integração com o sistema de navegação baseado em URL
  const { navigateToConversation, navigateToNewConversation } = useConversationNavigation(
    currentConversationId,
    setCurrentConversationId,
    conversations
  );

  // Create a stubbed sendMessage handler
  const sendMessage = async (content: string, conversationId: string | null) => {
    // Simple stub implementation
    console.log(`Sending message to conversation ${conversationId}: ${content}`);
    
    // Add user message
    const userMessage = addUserMessage(content);
    
    // Add a delayed assistant response
    setTimeout(() => {
      addAssistantMessage("This is a stubbed response. Messaging functionality is not fully implemented.");
    }, 1000);
    
    return true;
  };

  const isSending = false;

  // Função clara e explícita para carregar mensagens de uma conversa
  const loadConversationMessages = useCallback(async (conversationId: string) => {
    console.log(`[useConversation] Carregando mensagens para conversa: ${conversationId}`);
    
    if (!conversationId) {
      console.log('[useConversation] ID de conversa inválido, ignorando carregamento');
      return false;
    }
    
    if (loadingRef.current) {
      console.log('[useConversation] Já está carregando mensagens, ignorando requisição');
      return false;
    }
    
    try {
      // Definir flag para prevenir múltiplas chamadas
      loadingRef.current = true;
      setLoading(true);
      
      // Limpar mensagens antes de carregar novas para feedback visual imediato
      clearMessages();
      
      // Atualizar a referência da última conversa carregada
      lastLoadedConversationRef.current = conversationId;
      
      // Carregar mensagens para a conversa selecionada
      const success = await loadMessages(
        conversationId,
        setLoading,
        setMessages,
        clearMessages,
        setError
      );
      
      if (success) {
        setInitialLoadDone(true);
        console.log(`[useConversation] Carregamento de mensagens concluído para conversa: ${conversationId}`);
        return true;
      } else {
        console.error(`[useConversation] Falha ao carregar mensagens para conversa: ${conversationId}`);
        return false;
      }
    } catch (err) {
      console.error("[useConversation] Erro ao carregar mensagens:", err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar mensagens');
      return false;
    } finally {
      // Sempre resetar flag de carregamento quando a operação terminar
      loadingRef.current = false;
      setLoading(false);
    }
  }, [clearMessages, setError, setLoading, setMessages]);

  // Função para forçar o recarregamento de mensagens
  const forceReloadMessages = useCallback(() => {
    if (currentConversationId) {
      console.log(`[useConversation] Forçando recarregamento da conversa: ${currentConversationId}`);
      // Reset tracking variables to force reload
      lastLoadedConversationRef.current = null;
      setInitialLoadDone(false);
      // Clear messages first for immediate visual feedback
      clearMessages();
      // Load messages for the current conversation
      loadConversationMessages(currentConversationId);
    } else {
      console.log('[useConversation] Não há conversa selecionada para recarregar');
      // Just clear messages when no conversation is selected
      clearMessages();
    }
  }, [currentConversationId, loadConversationMessages, clearMessages]);

  // Efeito para carregar mensagens quando a conversa muda
  useEffect(() => {
    console.log(`[useConversation] Efeito de carregamento de conversa acionado. ID atual: ${currentConversationId}`);
    
    if (!currentConversationId) {
      // Se nenhuma conversa estiver selecionada, limpar mensagens
      console.log('[useConversation] Nenhuma conversa selecionada, limpando mensagens');
      clearMessages();
      lastLoadedConversationRef.current = null;
      setInitialLoadDone(false);
      return;
    }
    
    // Verificar se precisamos carregar esta conversa
    const needToLoadConversation = 
      currentConversationId !== lastLoadedConversationRef.current || 
      !initialLoadDone;
    
    if (needToLoadConversation && !loadingRef.current) {
      console.log(`[useConversation] Mudança detectada, carregando conversa: ${currentConversationId}`);
      // Carregar mensagens para a conversa selecionada
      loadConversationMessages(currentConversationId);
    } else {
      console.log('[useConversation] Não é necessário recarregar a conversa atual');
    }
  }, [currentConversationId, clearMessages, loadConversationMessages, initialLoadDone]);

  // Criar uma nova conversa com navegação atualizada
  const handleCreateNewConversation = async () => {
    console.log('[useConversation] Criando nova conversa');
    
    try {
      // Forçar limpeza de mensagens imediatamente para feedback visual
      clearMessages();
      
      // Definir estado de carregamento
      setLoading(true);
      
      // Criar a nova conversa
      const { success, data } = await createNewConversation(
        setLoading, 
        addConversation, 
        clearMessages,
        setError
      );
      
      if (success && data) {
        console.log(`[useConversation] Nova conversa criada com sucesso com ID: ${data.id}`);
        
        // Forçar limpeza de mensagens novamente após a conversa ser criada
        clearMessages();
        
        // Resetar variáveis de rastreamento para forçar uma atualização
        lastLoadedConversationRef.current = data.id;
        setInitialLoadDone(true);
        
        // Definir o ID da conversa atual e atualizar a URL
        setCurrentConversationId(data.id);
        navigateToNewConversation(data.id);
        
        toast.success('Nova conversa criada');
        return true;
      } else {
        console.error('[useConversation] Falha ao criar nova conversa');
        toast.error('Erro ao criar nova conversa');
        return false;
      }
    } catch (err) {
      console.error('[useConversation] Erro ao criar nova conversa:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao criar conversa');
      toast.error('Erro ao criar nova conversa');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Excluir conversa com atualização de navegação
  const handleDeleteConversation = async (id: string) => {
    try {
      // Prevent multiple delete operations
      if (deletingRef.current) {
        console.log('[useConversation] Exclusão já em andamento, ignorando requisição');
        return false;
      }
      
      deletingRef.current = true;
      
      // Clear messages and reset current conversation ID first
      clearMessages();
      
      if (id === currentConversationId) {
        // Resetar o ID da conversa atual
        setCurrentConversationId(null);
        lastLoadedConversationRef.current = null;
        setInitialLoadDone(false);
        
        // Get next available conversation
        const nextConversation = conversations.find(conv => conv.id !== id);
        
        // Delete the current conversation
        const result = await deleteConversation(
          id, 
          setLoading, 
          removeConversation,
          setError
        );
        
        if (!result) {
          console.error('[useConversation] Falha ao excluir conversa');
          toast.error('Erro ao excluir conversa');
          return false;
        }
        
        // Navigate to the next conversation or home page
        if (nextConversation) {
          console.log(`[useConversation] Navegando para próxima conversa: ${nextConversation.id}`);
          // Use setTimeout to ensure UI updates before navigation
          setTimeout(() => {
            navigateToConversation(nextConversation.id);
          }, 100);
        } else {
          console.log('[useConversation] Não há mais conversas, navegando para página inicial');
          // Use setTimeout to ensure UI updates before navigation
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 100);
        }
      } else {
        // For non-active conversations, just delete
        const result = await deleteConversation(
          id, 
          setLoading, 
          removeConversation,
          setError
        );
        
        if (!result) {
          console.error('[useConversation] Falha ao excluir conversa');
          toast.error('Erro ao excluir conversa');
          return false;
        }
      }
      
      toast.success('Conversa excluída com sucesso');
      return true;
    } catch (err) {
      console.error('[useConversation] Erro ao excluir conversa:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao excluir conversa');
      toast.error('Erro ao excluir conversa');
      return false;
    } finally {
      deletingRef.current = false;
    }
  };

  // Renomear conversa
  const handleRenameConversation = async (id: string, newTitle: string) => {
    return await renameConversation(
      id, 
      newTitle, 
      setLoading, 
      updateConversationTitle,
      setError
    );
  };

  // Atualizar título da conversa com base no conteúdo da mensagem
  const handleUpdateTitle = async (conversationId: string, content: string) => {
    return await handleTitleUpdate(
      conversations,
      updateConversationTitle,
      conversationId,
      content
    );
  };

  return {
    // Estado
    messages,
    conversations,
    currentConversationId,
    loading,
    error,
    initialLoadDone,
    
    // Setters de estado
    setMessages,
    setCurrentConversationId,
    setLoading,
    setError,
    
    // Ações de mensagem
    sendMessage,
    isSending,
    clearMessages,
    addUserMessage,
    addAssistantMessage,
    addErrorMessage,
    saveUserMessage,
    removeLoadingMessages,
    loadMessages: loadConversationMessages,
    forceReloadMessages,
    
    // Ações de conversa
    updateConversations,
    createNewConversation: handleCreateNewConversation,
    deleteConversation: handleDeleteConversation,
    renameConversation: handleRenameConversation,
    updateTitle: handleUpdateTitle,
    
    // Navegação
    navigateToConversation
  };
}
