
import { createClient } from '@supabase/supabase-js';
import { ChatMode } from '@/components/ModeSelector';
import { LumaParams } from '@/components/LumaParamsButton';
import { toast } from 'sonner';
import { supabase, PROJECT_REF } from '@/integrations/supabase/client';

// Interface para resposta da API
export interface ApiResponse {
  content: string;
  files?: string[];
  error?: string;
}

/**
 * Hook que fornece serviços de API para comunicação com modelos de IA
 */
export function useApiService() {
  /**
   * Envia uma solicitação para o modelo de IA especificado
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
  
  return {
    sendRequest
  };
}
