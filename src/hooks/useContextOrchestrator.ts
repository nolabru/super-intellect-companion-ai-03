
import { useMemo } from 'react';
import { ContextOrchestrator } from '../services/context/ContextOrchestrator';
import { ContextParams, ContextResult } from '../services/context/types/ContextTypes';
import { ContextProcessor } from '../services/context/processors/ContextProcessor';
import { TextContextProcessor } from '../services/context/processors/TextContextProcessor';
import { ContextStrategyService } from '../services/context/strategies/ContextStrategyService';
import { DefaultContextStrategy } from '../services/context/strategies/DefaultContextStrategy';
import { useAuth } from '../contexts/AuthContext';
import { SupabaseContextRepository } from '../repositories/implementations/SupabaseContextRepository';
import { SupabaseMemoryRepository } from '../repositories/implementations/SupabaseMemoryRepository';

/**
 * Hook to use the Context Orchestrator in React components
 */
export function useContextOrchestrator() {
  const { user } = useAuth();
  
  // Create processors, repositories, and strategy service
  const contextRepository = useMemo(() => new SupabaseContextRepository(), []);
  const memoryRepository = useMemo(() => new SupabaseMemoryRepository(), []);
  const processors = useMemo(() => [new TextContextProcessor()], []);
  const strategyService = useMemo(() => {
    const service = new ContextStrategyService();
    service.registerStrategy(new DefaultContextStrategy());
    return service;
  }, []);
  
  // Create and memoize the orchestrator
  const orchestrator = useMemo(() => {
    return new ContextOrchestrator(
      contextRepository,
      memoryRepository,
      processors,
      strategyService
    );
  }, [contextRepository, memoryRepository, processors, strategyService]);
  
  /**
   * Build context for a conversation
   * @param conversationId - ID of the conversation
   * @param modelId - Model to build context for
   * @param mode - Chat mode
   * @param options - Additional options
   */
  const buildContext = async (
    conversationId: string,
    modelId: string,
    mode: string = 'text',
    options: Partial<ContextParams> = {}
  ): Promise<ContextResult> => {
    console.log(`[useContextOrchestrator] Iniciando construção de contexto para conversa ${conversationId}`);
    
    const params: ContextParams = {
      conversationId,
      modelId,
      mode,
      userId: user?.id,
      includeUserMemory: true,
      includeModelInfo: true,
      maxMessages: 30,
      ...options
    };
    
    console.log(`[useContextOrchestrator] Parâmetros de contexto:`, JSON.stringify(params, null, 2));
    
    try {
      const result = await orchestrator.buildContextForMessage(params);
      console.log(`[useContextOrchestrator] Contexto construído com sucesso: ${result.contextLength} caracteres`);
      return result;
    } catch (error) {
      console.error(`[useContextOrchestrator] Erro ao construir contexto:`, error);
      // Fallback para um contexto básico em caso de erro
      return {
        formattedContext: "Histórico de conversa não disponível devido a um erro no sistema.\n\n",
        contextLength: 0,
        includedMessages: [],
        includedMemory: [],
        targetModel: modelId,
        strategyUsed: "FallbackStrategy",
        memoryIncluded: false,
        metrics: {
          processingTimeMs: 0,
          estimatedTokenCount: 0
        }
      };
    }
  };
  
  return {
    buildContext,
    processors,
    strategyService,
    orchestrator
  };
}
