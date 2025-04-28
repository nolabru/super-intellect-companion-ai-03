
import { ChatMode } from '@/components/ModeSelector';

/**
 * Valida e converte uma string para um tipo ChatMode válido
 * @param modeString String a ser validada
 * @returns ChatMode validado ('text', 'image', 'video', 'audio', 'call')
 */
export const validateChatMode = (modeString: string | undefined): ChatMode => {
  if (!modeString) return 'text';
  
  // Verificar se a string fornecida é um ChatMode válido
  if (['text', 'image', 'video', 'audio', 'call'].includes(modeString)) {
    return modeString as ChatMode;
  }
  
  // Default para 'text' se o modo não for válido
  console.warn(`Modo de chat inválido "${modeString}" recebido, definindo para "text"`);
  return 'text';
};

/**
 * Retorna uma mensagem de carregamento específica para o modo e modelo
 * @param mode Modo do chat (texto, imagem, vídeo, áudio, chamada)
 * @param modelId ID do modelo sendo usado
 * @returns Mensagem de carregamento personalizada
 */
export const getLoadingMessage = (mode: ChatMode, modelId: string): string => {
  let loadingMessage = 'Gerando resposta...';
  
  // Mensagens específicas de carregamento para cada modo
  if (mode === 'video') {
    if (modelId === 'luma-video') {
      loadingMessage = 'Conectando ao Luma AI para processamento de vídeo...';
    } else if (modelId === 'kligin-video') {
      loadingMessage = 'Aguardando processamento do serviço Kligin AI...';
    }
  } else if (mode === 'image') {
    if (modelId === 'luma-image') {
      loadingMessage = 'Conectando ao Luma AI para geração de imagem...';
    }
  } else if (mode === 'call') {
    loadingMessage = 'Iniciando chamada de voz...';
  }
  
  return loadingMessage;
};

/**
 * Verifica se um modelo suporta streaming
 * @param mode Modo do chat
 * @param modelId ID do modelo
 * @returns boolean indicando se o modelo suporta streaming
 */
export const modelSupportsStreaming = (mode: ChatMode, modelId: string): boolean => {
  if (mode === 'call') {
    return modelId.includes('gpt');
  }
  
  return mode === 'text' && (
    modelId.includes('gpt') || 
    modelId.includes('claude') || 
    modelId.includes('gemini')
  );
};

