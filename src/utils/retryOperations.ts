
/**
 * Utilitário para operações de retry com backoff exponencial
 */

/**
 * Interface para opções de retry
 */
export interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay?: number;
  factor?: number;
  retryCondition?: (error: any) => boolean;
  onRetry?: (error: any, attemptNumber: number) => void;
}

/**
 * Executa uma operação com retries automáticos usando backoff exponencial
 * 
 * @param operation Função assíncrona a ser executada
 * @param options Opções de configuração dos retries
 * @returns Resultado da operação
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const {
    maxRetries,
    initialDelay,
    maxDelay = 30000,
    factor = 2,
    retryCondition = () => true,
    onRetry
  } = options;

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Verificar se devemos tentar novamente
      if (attempt >= maxRetries || !retryCondition(error)) {
        throw lastError;
      }
      
      // Calcular delay com backoff exponencial
      const delay = Math.min(
        initialDelay * Math.pow(factor, attempt),
        maxDelay
      );
      
      // Notificar callback de retry
      if (onRetry) {
        onRetry(error, attempt + 1);
      }
      
      console.log(`Tentativa ${attempt + 1}/${maxRetries} falhou. Tentando novamente em ${delay}ms...`);
      
      // Aguardar antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // Este ponto não deve ser alcançado, mas TypeScript exige um retorno
  throw lastError || new Error("Operação falhou após múltiplas tentativas");
}

/**
 * Executa uma operação com um fallback em caso de falha
 * 
 * @param primaryOperation Função principal a ser executada
 * @param fallbackOperation Função de fallback em caso de falha
 * @returns Resultado da operação (primária ou fallback)
 */
export async function withFallback<T>(
  primaryOperation: () => Promise<T>,
  fallbackOperation: (error: any) => Promise<T>
): Promise<T> {
  try {
    return await primaryOperation();
  } catch (error) {
    console.warn('Operação primária falhou, utilizando fallback:', error);
    return await fallbackOperation(error);
  }
}
