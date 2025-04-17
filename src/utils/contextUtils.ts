
import { MessageType } from '@/components/ChatMessage';

/**
 * Utilitários para gerenciamento de contexto das conversas
 */

/**
 * Remove conteúdo pesado como URLs e base64 de uma string
 * @param content Conteúdo a ser limpo
 * @returns Conteúdo limpo
 */
export const cleanContentForContext = (content: string): string => {
  if (!content) return '';
  
  let cleanContent = content;
  
  // Remover dados de imagem base64 longos
  cleanContent = cleanContent.replace(/data:image\/[^;]+;base64,[^\s]{100,}/g, '[IMAGEM]');
  
  // Remover URLs longos
  cleanContent = cleanContent.replace(/(https?:\/\/[^\s]{50,})/g, '[URL]');
  
  // Remover blocos de código muito grandes (mais de 500 chars)
  cleanContent = cleanContent.replace(/```[\s\S]{500,}```/g, '[BLOCO DE CÓDIGO]');
  
  return cleanContent;
};

/**
 * Filtra mensagens para uso em contexto
 * @param messages Lista de mensagens
 * @param maxMessages Número máximo de mensagens para incluir
 * @returns Mensagens filtradas
 */
export const filterMessagesForContext = (
  messages: MessageType[], 
  maxMessages = 30
): MessageType[] => {
  if (!messages || messages.length === 0) {
    console.log('[contextUtils] Sem mensagens para filtrar');
    return [];
  }
  
  // Pegar as últimas X mensagens
  const recentMessages = messages.slice(-maxMessages);
  console.log(`[contextUtils] Filtrando mensagens: ${messages.length} total, pegando últimas ${maxMessages}`);
  
  // Remover mensagens de loading ou erro, garantir que seja apenas user ou assistant
  const filteredMessages = recentMessages.filter(msg => {
    const isUserOrAssistant = msg.sender === 'user' || msg.sender === 'assistant';
    const isNotLoading = !msg.loading;
    const isNotError = !msg.error;
    
    if (!isUserOrAssistant) {
      console.log(`[contextUtils] Excluindo mensagem com sender inválido: ${msg.sender}`);
    }
    
    return isUserOrAssistant && isNotLoading && isNotError;
  });
  
  console.log(`[contextUtils] Após filtragem: ${filteredMessages.length} mensagens restantes`);
  return filteredMessages;
};

/**
 * Formata as mensagens em um formato legível para o contexto
 * @param messages Mensagens a serem formatadas
 * @param includeModelInfo Se deve incluir informações do modelo nas mensagens
 * @returns String formatada com o contexto
 */
export const formatMessagesForContext = (
  messages: MessageType[],
  includeModelInfo = true
): string => {
  if (!messages || messages.length === 0) {
    console.log('[contextUtils] Sem mensagens para formatar');
    return '';
  }
  
  console.log(`[contextUtils] Formatando ${messages.length} mensagens para contexto`);
  
  // Adicionar cabeçalho
  let context = "Histórico de conversa:\n\n";
  
  // Formatar cada mensagem
  const formattedMessages = messages.map(msg => {
    // Incluir informação do modelo nas respostas
    const modelInfo = includeModelInfo && msg.model ? ` (modelo: ${msg.model})` : '';
    const role = msg.sender === 'user' ? 'Usuário' : `Assistente${modelInfo}`;
    
    // Limpar conteúdo
    const cleanContent = cleanContentForContext(msg.content);
    
    // Adicionar indicação de anexos
    const hasFiles = msg.files && msg.files.length > 0 
      ? ` [Inclui ${msg.files.length} arquivo(s)]` 
      : '';
    
    return `${role}${hasFiles}: ${cleanContent}`;
  }).join('\n\n');
  
  context += formattedMessages;
  
  // Adicionar instrução explícita para manter contexto
  context += '\n\nLembre-se das mensagens anteriores ao responder. É essencial manter o contexto da conversa.';
  
  console.log(`[contextUtils] Contexto formatado: ${context.length} caracteres`);
  
  return context;
};

/**
 * Prepara o contexto completo da conversa para envio à API
 * @param messages Lista de mensagens
 * @param userMemoryContext Contexto de memória do usuário (opcional)
 * @param maxMessages Número máximo de mensagens a incluir
 * @returns Contexto formatado
 */
export const prepareFullContext = (
  messages: MessageType[],
  userMemoryContext?: string,
  maxMessages = 30
): string => {
  console.log(`[contextUtils] Preparando contexto completo com ${messages.length} mensagens`);
  
  // Filtrar mensagens relevantes
  const filteredMessages = filterMessagesForContext(messages, maxMessages);
  
  // Formatar as mensagens para contexto
  const conversationContext = formatMessagesForContext(filteredMessages);
  
  // Combinar com contexto de memória do usuário, se disponível
  if (userMemoryContext && userMemoryContext.trim()) {
    const fullContext = `${userMemoryContext}\n\n${conversationContext}`;
    console.log(`[contextUtils] Contexto completo: ${fullContext.length} caracteres (com memória)`);
    return fullContext;
  }
  
  console.log(`[contextUtils] Contexto completo: ${conversationContext.length} caracteres (sem memória)`);
  return conversationContext;
};
