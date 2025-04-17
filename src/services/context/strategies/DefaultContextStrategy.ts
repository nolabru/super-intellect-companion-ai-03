
import { ContextMessage, UserMemory, ContextParams } from '../types/ContextTypes';
import { BaseContextStrategy } from './BaseContextStrategy';

/**
 * Default strategy for formatting context
 * Works for most text-based models
 */
export class DefaultContextStrategy extends BaseContextStrategy {
  /**
   * Check if this strategy can handle the given model and mode
   * @param modelId - Model identifier
   * @param mode - Chat mode
   */
  canHandle(modelId: string, mode: string): boolean {
    // This is the default strategy that handles most text-based models
    return mode === 'text' || !mode;
  }
  
  /**
   * Format context for a specific model
   * @param messages - Messages to include in context
   * @param userMemory - User memory items to include
   * @param params - Context parameters
   */
  formatForModel(
    messages: ContextMessage[],
    userMemory: UserMemory[],
    params: ContextParams
  ): string {
    // Filter messages based on parameters
    const maxMessages = params.maxMessages || 30;
    const filteredMessages = this.filterMessagesForContext(messages, maxMessages);
    
    // Format conversation history
    let context = "Histórico da conversa:\n\n";
    
    filteredMessages.forEach((msg, index) => {
      const role = msg.sender === 'user' ? 'Usuário' : 'Assistente';
      const modelInfo = params.includeModelInfo && msg.model ? ` (modelo: ${msg.model})` : '';
      const cleanContent = this.cleanContentForContext(msg.content);
      
      context += `${role}${modelInfo}: ${cleanContent}\n\n`;
    });
    
    // Add user memory if requested
    if (params.includeUserMemory && userMemory && userMemory.length > 0) {
      const memoryContext = this.formatMemoryContext(userMemory);
      context = `${memoryContext}\n\n${context}`;
    }
    
    // Add instructions to maintain context
    context += "Mantenha o contexto da conversa anterior ao responder. Use as informações do histórico e da memória do usuário para personalizar sua resposta.";
    
    console.log(`[DefaultContextStrategy] Formatted context with ${filteredMessages.length} messages, context length: ${context.length}`);
    return context;
  }
}
