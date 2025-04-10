
import { useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

/**
 * Hook para gerenciar a navegação baseada em conversas
 * Sincroniza o ID da conversa na URL com o estado da aplicação
 */
export function useConversationNavigation(
  currentConversationId: string | null,
  setCurrentConversationId: (id: string | null) => void,
  conversations: Array<{ id: string }>
) {
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  const location = useLocation();

  // Effect para sincronizar o ID da conversa na URL com o estado
  useEffect(() => {
    // Se estamos na rota raiz e temos um ID de conversa selecionado, atualizar a URL
    if (location.pathname === '/' && currentConversationId) {
      console.log(`[useConversationNavigation] Navegando para conversa: ${currentConversationId}`);
      navigate(`/c/${currentConversationId}`, { replace: true });
    } 
    // Se estamos na rota raiz sem conversa selecionada, mantemos assim
    else if (location.pathname === '/') {
      console.log('[useConversationNavigation] Na página inicial sem conversa selecionada');
    }
  }, [currentConversationId, navigate, location.pathname]);

  // Effect para quando o ID da URL muda
  useEffect(() => {
    // Se temos um ID na URL diferente do estado atual, atualizar o estado
    if (conversationId && conversationId !== currentConversationId) {
      console.log(`[useConversationNavigation] ID na URL mudou para: ${conversationId}`);
      
      // Verificar se a conversa existe
      const conversationExists = conversations.some(conv => conv.id === conversationId);
      
      if (conversationExists) {
        console.log(`[useConversationNavigation] Definindo conversa atual para: ${conversationId}`);
        setCurrentConversationId(conversationId);
      } else {
        console.log(`[useConversationNavigation] Conversa ${conversationId} não encontrada`);
        // Redirecionar para a página inicial se a conversa não existir
        navigate('/', { replace: true });
      }
    }
  }, [conversationId, currentConversationId, setCurrentConversationId, navigate, conversations]);

  // Método para navegar para uma conversa
  const navigateToConversation = (id: string | null) => {
    if (id) {
      console.log(`[useConversationNavigation] Navegando para conversa: ${id}`);
      navigate(`/c/${id}`);
    } else {
      console.log('[useConversationNavigation] Navegando para a página inicial');
      navigate('/');
    }
  };

  // Método para criar uma nova conversa e navegar para ela
  const navigateToNewConversation = (id: string) => {
    console.log(`[useConversationNavigation] Navegando para nova conversa: ${id}`);
    navigate(`/c/${id}`);
  };

  return {
    navigateToConversation,
    navigateToNewConversation
  };
}
