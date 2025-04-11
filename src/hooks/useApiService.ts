
import { createClient } from '@supabase/supabase-js';
import { ChatMode } from '@/components/ModeSelector';
import { LumaParams } from '@/components/LumaParamsButton';
import { toast } from 'sonner';

// Definindo o cliente Supabase com URL e chave anônima
const supabaseUrl = 'https://vygluorjwehcdigzxbaa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5Z2x1b3Jqd2VoY2RpZ3p4YmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNDI2NjcsImV4cCI6MjA1OTYxODY2N30.uuV_JYIUKuv1rV3-MicDiTT28azOWdhJoVjpHMfzVGg';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Interface para resposta da API
export interface ApiResponse {
  content: string;
  files?: string[];
  error?: string;
}

// Interface para a resposta da função de armazenamento de mídia
interface StorageResponse {
  success: boolean;
  publicUrl?: string;
  storagePath?: string;
  error?: string;
}

/**
 * Hook que fornece serviços de API para comunicação com modelos de IA
 */
export function useApiService() {
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
      console.log(`Armazenando mídia no Supabase: ${mediaUrl.substring(0, 100)}...`);
      
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
    params?: LumaParams
  ): Promise<ApiResponse> => {
    const maxRetries = 2;
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Registrar tentativas de retry
        if (attempt > 0) {
          console.log(`Tentativa ${attempt}/${maxRetries} de chamar a Edge Function...`);
        }
        
        // Chamar a Edge Function
        const { data, error } = await supabase.functions.invoke('ai-chat', {
          body: {
            content,
            mode,
            modelId,
            files,
            params
          },
        });
        
        if (error) {
          console.error('Erro ao chamar a Edge Function:', error);
          throw new Error(`Erro ao chamar a API: ${error.message}`);
        }
        
        // Se é uma mídia gerada, salvar no storage para persistência
        if (data.files && data.files.length > 0 && (mode === 'image' || mode === 'video' || mode === 'audio')) {
          try {
            // Obter informações do usuário atual
            const { data: userData } = await supabase.auth.getUser();
            const userId = userData?.user?.id;
            
            // Tentar salvar a mídia no storage
            const mediaUrl = data.files[0];
            const fileName = `${Date.now()}-${modelId}.${getExtensionFromUrl(mediaUrl)}`;
            
            const contentType = getContentTypeFromMode(mode);
            
            const storageResponse = await storeMedia(
              mediaUrl,
              fileName,
              contentType,
              userId,
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
              console.warn('Falha ao persistir mídia, usando URL original temporária');
            }
          } catch (storageErr) {
            console.error('Erro ao tentar persistir mídia:', storageErr);
            // Continuar com a URL original mesmo em caso de erro
          }
        }
        
        return data;
      } catch (err) {
        console.error(`Erro ao enviar para a API (tentativa ${attempt + 1}/${maxRetries + 1}):`, err);
        lastError = err;
        
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
      return 'jpg'; // Padrão para imagens
    } catch (e) {
      return 'bin'; // Fallback genérico
    }
  };
  
  // Função auxiliar para obter o content type com base no modo
  const getContentTypeFromMode = (mode: string): string => {
    switch (mode) {
      case 'video':
        return 'video/mp4';
      case 'audio':
        return 'audio/mpeg';
      case 'image':
        return 'image/jpeg';
      default:
        return 'application/octet-stream';
    }
  };
  
  return {
    sendRequest,
    storeMedia
  };
}
