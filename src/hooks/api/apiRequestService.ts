
import { supabase } from '@/integrations/supabase/client';
import { ChatMode } from '@/components/ModeSelector';
import { LumaParams } from '@/components/LumaParamsButton';
import { toast } from 'sonner';
import { mediaStorageService } from './mediaStorageService';

/**
 * Interface para resposta da API
 */
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

/**
 * Tipo para o callback de streaming
 */
export type StreamListener = (chunk: string) => void;

/**
 * Serviço para envio de requisições para a API
 */
export const apiRequestService = {
  /**
   * Envia uma solicitação para o modelo de IA especificado
   */
  async sendRequest(
    content: string, 
    mode: ChatMode, 
    modelId: string, 
    files?: string[],
    params?: LumaParams,
    enableStreaming: boolean = false,
    streamListener?: StreamListener,
    conversationHistory?: string,
    userId?: string
  ): Promise<ApiResponse> {
    const maxRetries = 2;
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Registrar tentativas de retry
        if (attempt > 0) {
          console.log(`[apiRequestService] Tentativa ${attempt}/${maxRetries} de chamar a Edge Function...`);
        }
        
        // Verificar se o streaming está disponível para esse modelo e modo
        const canUseStreaming = enableStreaming && 
                               mode === 'text' && 
                               (modelId.includes('gpt') || 
                                modelId.includes('claude') || 
                                modelId.includes('gemini')) &&
                               streamListener !== undefined;
        
        // Tratar o caso específico de geração de vídeo com Kling AI
        if (mode === 'video' && modelId === 'kling-v1-5') {
          console.log(`[apiRequestService] Iniciando geração de vídeo com Kling AI`);
          
          // Chamar a edge function específica para Kling AI
          const { data, error } = await supabase.functions.invoke('apiframe-kling-video', {
            body: {
              prompt: content,
              params: params || {},
              generationType: "text2video"
            },
          });
          
          if (error) {
            console.error('[apiRequestService] Erro na chamada para apiframe-kling-video:', error);
            throw new Error(`Erro na geração de vídeo: ${error.message || 'Falha na comunicação com o servidor'}`);
          }
          
          if (!data || !data.success) {
            throw new Error(data?.error || 'Falha na geração de vídeo');
          }
          
          console.log('[apiRequestService] Resposta da geração de vídeo:', data);
          
          // Criar uma resposta compatível com o formato esperado
          return {
            content: `Vídeo sendo gerado com a prompt: "${content}". Seu vídeo logo estará pronto.`,
            files: data.mediaUrl ? [data.mediaUrl] : undefined,
            modeSwitch: {
              newMode: 'video',
              newModel: modelId
            }
          };
        }
        
        // Preparar os dados da requisição para outros modelos
        const requestBody = {
          prompt: content, // Aqui modificamos para usar 'prompt' em vez de 'content'
          mode,
          model: modelId,
          files,
          params,
          userId, // Usar userId passado 
          conversationHistory // Incluir histórico da conversa
        };
        
        if (canUseStreaming) {
          console.log(`[apiRequestService] Iniciando streaming com modelo ${modelId}`);
          
          // Chamar Edge Function para obter resposta completa
          const { data, error } = await supabase.functions.invoke('ai-chat', {
            body: requestBody,
          });
          
          if (error) {
            // Verificar o tipo de erro
            console.error('[apiRequestService] Erro na resposta da Edge Function:', error);
            
            // Verificar se o erro é devido a tokens insuficientes
            if (error.message?.includes('402') || 
                error.status === 402 || 
                (data && data.error === 'INSUFFICIENT_TOKENS')) {
              throw new Error('Você não tem tokens suficientes para esta operação. Aguarde o próximo reset mensal ou entre em contato com o suporte.');
            }
            
            // Verificar se o erro está relacionado à chave API
            if (error.message?.includes('API key') || error.message?.includes('Authentication')) {
              throw new Error('Verifique se a chave API do OpenAI está configurada corretamente na Edge Function.');
            }
            
            throw new Error(`[apiRequestService] Erro ao chamar a API: ${error.message || 'Edge Function retornou um código de status não 2xx'}`);
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
            console.error('[apiRequestService] Erro ao chamar a Edge Function:', error);
            
            // Verificar se o erro é sobre tokens insuficientes
            if (error.status === 402 || 
                error.message?.includes('402') || 
                error.message?.includes('INSUFFICIENT_TOKENS') ||
                (data && data.error === 'INSUFFICIENT_TOKENS')) {
              throw new Error('Você não tem tokens suficientes para esta operação. Aguarde o próximo reset mensal ou entre em contato com o suporte.');
            }
            
            // Verificar se o erro está relacionado à chave API
            if (error.message?.includes('API key') || error.message?.includes('Authentication')) {
              throw new Error('Verifique se a chave API do OpenAI está configurada corretamente na Edge Function.');
            }
            
            throw new Error(`[apiRequestService] Erro ao chamar a API: ${error.message || 'Edge Function retornou um código de status não 2xx'}`);
          }
          
          console.log('[apiRequestService] Resposta recebida da Edge Function:', {
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
            console.error('[apiRequestService] Detectada URL de placeholder ou mock na resposta:', data.files[0]);
            throw new Error('A API retornou uma URL de placeholder ou mock. Verifique a configuração do OPENAI_API_KEY no Supabase.');
          }
          
          // Se é uma mídia gerada, salvar no storage para persistência
          if (data.files && data.files.length > 0 && (mode === 'image' || mode === 'video' || mode === 'audio') && 
              (modelId === 'dall-e-3' || modelId === 'gpt-4o' || data.modeSwitch)) {
            try {
              // Tentar salvar a mídia no storage
              const mediaUrl = data.files[0];
              const isBase64 = mediaUrl.startsWith('data:');
              
              let fileExt;
              let contentType;
              
              if (isBase64) {
                // Extrair o tipo de conteúdo da URL base64
                const matches = mediaUrl.match(/^data:([^;]+);base64,/);
                contentType = matches ? matches[1] : mediaStorageService.getContentTypeFromMode(mode);
                fileExt = mediaStorageService.getExtensionFromContentType(contentType);
              } else {
                fileExt = mediaStorageService.getExtensionFromUrl(mediaUrl);
                contentType = mediaStorageService.getContentTypeFromMode(mode);
              }
              
              const fileName = `${Date.now()}-${modelId}.${fileExt}`;
              
              console.log(`[apiRequestService] Preparando para armazenar mídia ${isBase64 ? 'base64' : 'URL'}, tipo: ${contentType}, extensão: ${fileExt}`);
              
              const storageResponse = await mediaStorageService.storeMedia(
                mediaUrl,
                fileName,
                contentType,
                userId,
                undefined, // conversationId não é necessário aqui
                mode
              );
              
              // Se o storage foi bem-sucedido, substituir a URL da mídia
              if (storageResponse.success && storageResponse.publicUrl) {
                console.log(`[apiRequestService] Mídia persistida com sucesso: ${storageResponse.publicUrl}`);
                
                // Atualizar data.files com a URL persistida
                data.files[0] = storageResponse.publicUrl;
                
                // Se a resposta continha o URL original, atualizar a mensagem
                if (data.content.includes(mediaUrl)) {
                  data.content = data.content.replace(mediaUrl, storageResponse.publicUrl);
                }
              } else {
                // Para imagens geradas pela DALL-E, usar a base64 diretamente se o armazenamento falhar
                if (mode === 'image' && isBase64) {
                  console.log('[apiRequestService] Usando dados base64 diretamente para a imagem DALL-E');
                  // Deixa o base64 original na resposta
                } else {
                  console.warn('[apiRequestService] Falha ao persistir mídia, usando URL original temporária');
                }
              }
            } catch (storageErr) {
              console.error('[apiRequestService] Erro ao tentar persistir mídia:', storageErr);
              // Continuar com a URL original mesmo em caso de erro - para base64, isso significa usar o base64 original
            }
          }
          
          return data;
        }
      } catch (err) {
        console.error(`[apiRequestService] Erro ao enviar para a API (tentativa ${attempt + 1}/${maxRetries + 1}):`, err);
        lastError = err;
        
        // Se o erro é relacionado a tokens ou à chave API, não tente novamente
        if (err instanceof Error && (
            err.message.includes('tokens') || 
            err.message.includes('Tokens') || 
            err.message.includes('402') ||
            err.message.includes('API key') ||
            err.message.includes('Authentication')
        )) {
          break;
        }
        
        // Se não é a última tentativa, aguardar antes de tentar novamente
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Backoff exponencial
          console.log(`[apiRequestService] Aguardando ${delay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // Se chegamos aqui, todas as tentativas falharam
    const errorMessage = lastError instanceof Error ? lastError.message : "Falha após tentativas máximas";
    
    // Verificar se o erro é sobre tokens insuficientes para mostrar uma mensagem mais amigável
    if (errorMessage.includes('tokens') || errorMessage.includes('Tokens') || errorMessage.includes('402')) {
      toast.error('Você não tem tokens suficientes para esta operação. Aguarde o próximo reset mensal ou entre em contato com o suporte.');
    } else {
      toast.error(`Falha na comunicação com o servidor: ${errorMessage}`);
    }
    
    throw lastError || new Error("Falha após tentativas máximas");
  }
};
