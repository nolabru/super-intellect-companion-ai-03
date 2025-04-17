
import { MessageType } from '@/components/ChatMessage';

export const cleanContentForContext = (content: string): string => {
  // Limpar conteúdo removendo dados extensos mas mantendo o texto importante
  const cleanedContent = content
    .replace(/data:image\/[^;]+;base64,[^\s]{100,}/g, '[IMAGEM]')
    .replace(/(https?:\/\/[^\s]{50,})/g, '[URL]')
    .replace(/```[\s\S]{500,}```/g, '[BLOCO DE CÓDIGO]')
    .trim();
    
  console.log('[contextUtils] Conteúdo limpo:', cleanedContent.substring(0, 100) + '...');
  return cleanedContent;
};

export const filterMessagesForContext = (
  messages: MessageType[], 
  maxMessages = 30
): MessageType[] => {
  if (!messages || messages.length === 0) {
    console.log('[contextUtils] Sem mensagens para filtrar');
    return [];
  }
  
  // Pegar as mensagens mais recentes primeiro
  const recentMessages = messages.slice(-maxMessages);
  console.log(`[contextUtils] Filtrando ${recentMessages.length} mensagens recentes`);
  
  const filteredMessages = recentMessages.filter(msg => {
    // Filtrar apenas mensagens válidas do usuário ou assistente
    const isValidSender = msg.sender === 'user' || msg.sender === 'assistant';
    const isNotSpecialMessage = !msg.loading && !msg.error && !msg.streaming;
    const isValid = isValidSender && isNotSpecialMessage;
    
    if (!isValid) {
      console.log(`[contextUtils] Mensagem ${msg.id} ignorada: loading=${msg.loading}, error=${msg.error}, streaming=${msg.streaming}`);
    }
    
    return isValid;
  });
  
  console.log(`[contextUtils] Total de ${filteredMessages.length} mensagens após filtragem`);
  return filteredMessages;
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
  
  messages.forEach((msg, index) => {
    const modelInfo = includeModelInfo && msg.model ? ` (modelo: ${msg.model})` : '';
    const role = msg.sender === 'user' ? 'Usuário' : `Assistente${modelInfo}`;
    const cleanContent = cleanContentForContext(msg.content);
    
    context += `${role}: ${cleanContent}\n\n`;
    
    if (index === messages.length - 1) {
      // Log últimas mensagens para depuração
      console.log(`[contextUtils] Última mensagem no contexto: ${role}: ${cleanContent.substring(0, 100)}...`);
    }
  });
  
  // Adicionar instruções específicas para manter contexto
  context += "Importante: Mantenha o contexto e o tom da conversa anterior. Se estiver discutindo tópicos específicos como música, mantenha o foco nesses tópicos.\n";
  
  console.log(`[contextUtils] Contexto formatado com ${messages.length} mensagens. Tamanho: ${context.length} caracteres`);
  return context;
};

export const prepareFullContext = (
  messages: MessageType[],
  userMemoryContext?: string,
  maxMessages = 30
): string => {
  console.log(`[contextUtils] Preparando contexto completo com ${messages.length} mensagens`);
  
  const filteredMessages = filterMessagesForContext(messages, maxMessages);
  const conversationContext = formatMessagesForContext(filteredMessages);
  
  let fullContext = '';
  
  if (userMemoryContext && userMemoryContext.trim()) {
    fullContext = `Contexto de Memória do Usuário:\n${userMemoryContext}\n\n${conversationContext}`;
    console.log('[contextUtils] Contexto de memória incluído');
  } else {
    fullContext = conversationContext;
    console.log('[contextUtils] Sem contexto de memória para incluir');
  }
  
  // Log para depuração do contexto final
  console.log(`[contextUtils] Contexto final preparado: ${fullContext.length} caracteres`);
  console.log(`[contextUtils] Primeiros 150 caracteres: ${fullContext.substring(0, 150)}...`);
  
  return fullContext;
};

