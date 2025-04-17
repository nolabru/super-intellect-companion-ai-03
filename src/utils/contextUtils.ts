
import { MessageType } from '@/components/ChatMessage';

export const cleanContentForContext = (content: string): string => {
  // Limpar conteúdo removendo dados extensos
  return content.replace(/data:image\/[^;]+;base64,[^\s]{100,}/g, '[IMAGEM]')
               .replace(/(https?:\/\/[^\s]{50,})/g, '[URL]')
               .replace(/```[\s\S]{500,}```/g, '[BLOCO DE CÓDIGO]')
               .trim();
};

export const filterMessagesForContext = (
  messages: MessageType[], 
  maxMessages = 30
): MessageType[] => {
  if (!messages || messages.length === 0) {
    console.log('[contextUtils] Sem mensagens para filtrar');
    return [];
  }
  
  const recentMessages = messages.slice(-maxMessages);
  
  return recentMessages.filter(msg => {
    const isValidSender = msg.sender === 'user' || msg.sender === 'assistant';
    const isNotSpecialMessage = !msg.loading && !msg.error && !msg.streaming;
    
    return isValidSender && isNotSpecialMessage;
  });
};

export const formatMessagesForContext = (
  messages: MessageType[],
  includeModelInfo = true
): string => {
  if (!messages || messages.length === 0) {
    console.log('[contextUtils] Sem mensagens para formatar');
    return '';
  }
  
  let context = "Histórico completo da conversa:\n\n";
  
  messages.forEach(msg => {
    const modelInfo = includeModelInfo && msg.model ? ` (modelo: ${msg.model})` : '';
    const role = msg.sender === 'user' ? 'Usuário' : `Assistente${modelInfo}`;
    const cleanContent = cleanContentForContext(msg.content);
    
    context += `${role}: ${cleanContent}\n\n`;
  });
  
  context += "Importante: Mantenha o contexto e o tom da conversa anterior.\n";
  
  return context;
};

export const prepareFullContext = (
  messages: MessageType[],
  userMemoryContext?: string,
  maxMessages = 30
): string => {
  const filteredMessages = filterMessagesForContext(messages, maxMessages);
  const conversationContext = formatMessagesForContext(filteredMessages);
  
  if (userMemoryContext && userMemoryContext.trim()) {
    return `Contexto de Memória do Usuário:\n${userMemoryContext}\n\n${conversationContext}`;
  }
  
  return conversationContext;
};

