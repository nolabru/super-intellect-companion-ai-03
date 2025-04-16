
import { createClient } from '@supabase/supabase-js';
import { ChatMode } from '@/components/ModeSelector';
import { LumaParams } from '@/components/LumaParamsButton';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// Definindo o cliente Supabase com URL e chave anônima
const supabaseUrl = 'https://vygluorjwehcdigzxbaa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5Z2x1b3Jqd2VoY2RpZ3p4YmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNDI2NjcsImV4cCI6MjA1OTYxODY2N30.uuV_JYIUKuv1rV3-MicDiTT28azOWdhJoVjpHMfzVGg';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Interface para resposta da API
export interface ApiResponse {
  content: string;
  files?: string[];
  error?: string;
  tokenInfo?: {
    tokensUsed: number;
    tokensRemaining: number;
  };
  modeSwitch?: {
    newMode: string;
    newModel: string;
  };
}

// Interface para a resposta da função de armazenamento de mídia
interface StorageResponse {
  success: boolean;
  publicUrl?: string;
  storagePath?: string;
  error?: string;
}

// Tipo para o callback de streaming
export type StreamListener = (chunk: string) => void;

/**
 * Hook que fornece serviços de API para comunicação com modelos de IA
 */
export function useApiService() {
  const { user } = useAuth();
  
  /**
   * Salva uma mídia gerada no storage do Supabase
   */
  const storeMedia = async (
    mediaUrl: string,
    fileName?: string,
    contentType?: string,
    userId?: string,
    conversationId?: string,
    mode?: string
  ): Promise<StorageResponse> => {
    try {
      // Check if it's a placeholder or mock URL and reject it
      if (mediaUrl.includes('placeholder.com') || mediaUrl.includes('MockAI')) {
        console.error('Detectada URL de placeholder ou mock, não armazenando:', mediaUrl);
        return {
          success: false,
          error: 'URL de placeholder ou mock detectada, não é possível armazenar'
        };
      }
      
      console.log(`Armazenando mídia no Supabase: ${mediaUrl.startsWith('data:') ? 'base64' : mediaUrl.substring(0, 50) + '...'}`);
      
      const { data, error } = await supabase.functions.invoke('media-storage', {
        body: {
          mediaUrl,
          fileName,
          contentType,
          userId,
          conversationId,
          mode
        },
      });
      
      if (error) {
        console.error('Erro ao armazenar mídia:', error);
        return {
          success: false,
          error: `Erro ao armazenar mídia: ${error.message}`
        };
      }
      
      console.log('Mídia armazenada com sucesso:', data);
      return data;
    } catch (err) {
      console.error('Erro durante armazenamento de mídia:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro desconhecido'
      };
    }
  };

  /**
   * Envia uma solicitação para o modelo de IA especificado e armazena mídias geradas
   */
  const sendRequest = async (
    content: string, 
    mode: ChatMode, 
    modelId: string, 
    files?: string[],
    params?: LumaParams,
    enableStreaming: boolean = false,
    streamListener?: StreamListener,
    conversationHistory?: string,
    userId?: string
  ): Promise<ApiResponse> => {
    const maxRetries = 2;
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Registrar tentativas de retry
        if (attempt > 0) {
          console.log(`Tentativa ${attempt}/${maxRetries} de chamar a Edge Function...`);
        }
        
        // Verificar se o streaming está disponível para esse modelo e modo
        const canUseStreaming = enableStreaming && 
                               mode === 'text' && 
                               (modelId.includes('gpt') || 
                                modelId.includes('claude') || 
                                modelId.includes('gemini')) &&
                               streamListener !== undefined;
        
        // Preparar os dados da requisição
        const requestBody = {
          content,
          mode,
          modelId,
          files,
          params,
          userId: user?.id || userId, // Usar userId passado ou do contexto
          conversationHistory // Novo: Incluir histórico da conversa
        };
        
        if (canUseStreaming) {
          console.log(`Iniciando streaming com modelo ${modelId}`);
          
          // Chamar Edge Function para obter resposta completa
          const { data, error } = await supabase.functions.invoke('ai-chat', {
            body: requestBody,
          });
          
          if (error) {
            // Verificar o tipo de erro
            console.error('Erro na resposta da Edge Function:', error);
            
            if (error.message) {
              // Verificar se o erro é devido a tokens insuficientes
              if (error.message.includes('402') || error.message.includes('INSUFFICIENT_TOKENS') || error.status === 402) {
                throw new Error('Você não tem tokens suficientes para esta operação. Aguarde o próximo reset mensal ou entre em contato com o suporte.');
              }
              
              // Verificar se o erro está relacionado à chave API
              if (error.message.includes('API key') || error.message.includes('Authentication')) {
                throw new Error('Verifique se a chave API do OpenAI está configurada corretamente na Edge Function.');
              }
            }
            
            throw new Error(`Erro ao chamar a API: ${error.message || 'Edge Function retornou um código de status não 2xx'}`);
          }
          
          // Simular streaming com a resposta completa
          if (data && data.content) {
            // Dividir a mensagem em chunks para simular o streaming
            const content = data.content;
            const words = content.split(' ');
            
            // Número de palavras por chunk (ajustar conforme necessário)
            const wordsPerChunk = 3;
            
            let accumulatedContent = '';
            
            // Processar em chunks
            for (let i = 0; i < words.length; i += wordsPerChunk) {
              const chunk = words.slice(i, i + wordsPerChunk).join(' ') + (i + wordsPerChunk < words.length ? ' ' : '');
              accumulatedContent += chunk;
              
              // Enviar chunk para o listener
              if (streamListener) {
                streamListener(accumulatedContent);
              }
              
              // Adicionar pequeno delay para simular streaming natural
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }
          
          // Retornar resposta completa depois do streaming simulado
          return data;
        } else {
          // Chamar a Edge Function normalmente (sem streaming)
          const { data, error } = await supabase.functions.invoke('ai-chat', {
            body: requestBody,
          });
          
          if (error) {
            console.error('Erro ao chamar a Edge Function:', error);
            
            // Verificar se o erro é sobre tokens insuficientes - verifica pelo código 402 ou pela mensagem
            if (error.status === 402 || 
                (error.message && (error.message.includes('402') || error.message.includes('INSUFFICIENT_TOKENS')))) {
              throw new Error('Você não tem tokens suficientes para esta operação. Aguarde o próximo reset mensal ou entre em contato com o suporte.');
            }
            
            // Verificar se o erro está relacionado à chave API
            if (error.message && (error.message.includes('API key') || error.message.includes('Authentication'))) {
              throw new Error('Verifique se a chave API do OpenAI está configurada corretamente na Edge Function.');
            }
            
            throw new Error(`Erro ao chamar a API: ${error.message || 'Edge Function retornou um código de status não 2xx'}`);
          }
          
          console.log('Resposta recebida da Edge Function:', {
            contentLength: data.content?.length,
            hasFiles: data.files && data.files.length > 0,
            fileType: data.files && data.files.length > 0 && data.files[0].startsWith('data:') ? 'base64' : 'url',
            firstFewChars: data.files && data.files.length > 0 ? data.files[0].substring(0, 30) + '...' : 'none',
            tokenInfo: data.tokenInfo,
            modeSwitch: data.modeSwitch ? 'detected' : 'none'
          });
          
          // Check if we got a placeholder or mock URL and reject it
          if (data.files && 
              data.files.length > 0 && 
              (data.files[0].includes('placeholder.com') || data.files[0].includes('MockAI'))) {
            console.error('Detectada URL de placeholder ou mock na resposta:', data.files[0]);
            throw new Error('A API retornou uma URL de placeholder ou mock. Verifique a configuração do OPENAI_API_KEY no Supabase.');
          }
          
          // Se é uma mídia gerada, salvar no storage para persistência
          if (data.files && data.files.length > 0 && (mode === 'image' || mode === 'video' || mode === 'audio') && 
              (modelId === 'dall-e-3' || modelId === 'gpt-4o' || data.modeSwitch)) {
            try {
              // Obter informações do usuário atual
              const { data: userData } = await supabase.auth.getUser();
              const userIdForStorage = userData?.user?.id || userId;
              
              // Tentar salvar a mídia no storage
              const mediaUrl = data.files[0];
              const isBase64 = mediaUrl.startsWith('data:');
              
              let fileExt;
              let contentType;
              
              if (isBase64) {
                // Extrair o tipo de conteúdo da URL base64
                const matches = mediaUrl.match(/^data:([^;]+);base64,/);
                contentType = matches ? matches[1] : getContentTypeFromMode(mode);
                fileExt = getExtensionFromContentType(contentType);
              } else {
                fileExt = getExtensionFromUrl(mediaUrl);
                contentType = getContentTypeFromMode(mode);
              }
              
              const fileName = `${Date.now()}-${modelId}.${fileExt}`;
              
              console.log(`Preparando para armazenar mídia ${isBase64 ? 'base64' : 'URL'}, tipo: ${contentType}, extensão: ${fileExt}`);
              
              const storageResponse = await storeMedia(
                mediaUrl,
                fileName,
                contentType,
                userIdForStorage,
                undefined, // conversationId não é necessário aqui
                mode
              );
              
              // Se o storage foi bem-sucedido, substituir a URL da mídia
              if (storageResponse.success && storageResponse.publicUrl) {
                console.log(`Mídia persistida com sucesso: ${storageResponse.publicUrl}`);
                
                // Atualizar data.files com a URL persistida
                data.files[0] = storageResponse.publicUrl;
                
                // Se a resposta continha o URL original, atualizar a mensagem
                if (data.content.includes(mediaUrl)) {
                  data.content = data.content.replace(mediaUrl, storageResponse.publicUrl);
                }
              } else {
                // Para imagens geradas pela DALL-E, usar a base64 diretamente se o armazenamento falhar
                if (mode === 'image' && isBase64) {
                  console.log('Usando dados base64 diretamente para a imagem DALL-E');
                  // Deixa o base64 original na resposta
                } else {
                  console.warn('Falha ao persistir mídia, usando URL original temporária');
                }
              }
            } catch (storageErr) {
              console.error('Erro ao tentar persistir mídia:', storageErr);
              // Continuar com a URL original mesmo em caso de erro - para base64, isso significa usar o base64 original
            }
          }
          
          return data;
        }
      } catch (err) {
        console.error(`Erro ao enviar para a API (tentativa ${attempt + 1}/${maxRetries + 1}):`, err);
        lastError = err;
        
        // Se o erro é relacionado a tokens ou à chave API, não tente novamente
        if (err instanceof Error && (
            err.message.includes('Token') || 
            err.message.includes('token') || 
            err.message.includes('402') ||
            err.message.includes('API key') ||
            err.message.includes('Authentication')
        )) {
          break;
        }
        
        // Se não é a última tentativa, aguardar antes de tentar novamente
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Backoff exponencial
          console.log(`Aguardando ${delay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // Se chegamos aqui, todas as tentativas falharam
    const errorMessage = lastError instanceof Error ? lastError.message : "Falha após tentativas máximas";
    toast.error(`Falha na comunicação com o servidor: ${errorMessage}`);
    throw lastError || new Error("Falha após tentativas máximas");
  };
  
  // Função auxiliar para obter extensão de arquivo a partir da URL
  const getExtensionFromUrl = (url: string): string => {
    try {
      // Remover parâmetros de query
      const urlWithoutParams = url.split('?')[0];
      
      // Obter a última parte da URL
      const parts = urlWithoutParams.split('/');
      const fileName = parts[parts.length - 1];
      
      // Obter extensão
      const extensionParts = fileName.split('.');
      if (extensionParts.length > 1) {
        return extensionParts[extensionParts.length - 1];
      }
      
      // Se não conseguir determinar, adivinhar pelo tipo
      if (url.includes('video')) return 'mp4';
      if (url.includes('audio')) return 'mp3';
      return 'png'; // Mudado de jpg para png para DALL-E
    } catch (e) {
      return 'png'; // Fallback para DALL-E (mudado de bin para png)
    }
  };
  
  // Função auxiliar para obter extensão a partir do tipo de conteúdo
  const getExtensionFromContentType = (contentType: string): string => {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'video/quicktime': 'mov',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav'
    };
    
    return map[contentType] || 'png'; // Padrão para DALL-E (mudado de jpg para png)
  };
  
  // Função auxiliar para obter o content type com base no modo
  const getContentTypeFromMode = (mode: string): string => {
    switch (mode) {
      case 'video':
        return 'video/mp4';
      case 'audio':
        return 'audio/mpeg';
      case 'image':
        return 'image/png'; // Mudado de image/jpeg para image/png para DALL-E
      default:
        return 'application/octet-stream';
    }
  };
  
  return {
    sendRequest,
    storeMedia
  };
}
