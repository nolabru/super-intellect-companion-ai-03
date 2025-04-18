
import { ContextMessage, UserMemory, ContextParams } from '../types/ContextTypes';
import { BaseContextStrategy } from './BaseContextStrategy';

/**
 * Default strategy for formatting context
 * Works with most models including GPT and Claude
 */
export class DefaultContextStrategy extends BaseContextStrategy {
  /**
   * Check if this strategy can handle the given model and mode
   * @param modelId - Model identifier
   * @param mode - Chat mode
   * @returns Whether this strategy can handle the combination
   */
  canHandle(modelId: string, mode: string): boolean {
    // This is the default fallback strategy, so it handles everything
    return true;
  }
  
  /**
   * Format context for a specific model
   * @param messages - Messages to include in context
   * @param userMemory - User memory items to include
   * @param params - Context parameters
   * @returns Formatted context string
   */
  formatForModel(
    messages: ContextMessage[],
    userMemory: UserMemory[],
    params: ContextParams
  ): string {
    console.log(`[DefaultContextStrategy] Formatando contexto com ${messages.length} mensagens e ${userMemory.length} itens de memória`);
    
    // Filter messages for context
    const filteredMessages = this.filterMessagesForContext(
      messages, 
      params.maxMessages || 30
    );
    
    console.log(`[DefaultContextStrategy] Filtrado para ${filteredMessages.length} mensagens relevantes`);
    
    // Build memory context if requested
    let memoryContext = '';
    if (params.includeUserMemory && userMemory.length > 0) {
      memoryContext = this.formatMemoryContext(userMemory, 'concise');
      console.log(`[DefaultContextStrategy] Contexto de memória: ${memoryContext.length} caracteres`);
    }
    
    // Start building the context with memory if available
    let fullContext = '';
    if (memoryContext) {
      fullContext += memoryContext + "\n\n";
    }
    
    // Add conversation history
    fullContext += "Histórico completo da conversa:\n\n";
    
    // Format each message in the conversation
    filteredMessages.forEach((msg, index) => {
      const modelInfo = params.includeModelInfo && msg.model ? ` (modelo: ${msg.model})` : '';
      const role = msg.sender === 'user' ? 'Usuário' : `Assistente${modelInfo}`;
      const cleanContent = this.cleanContentForContext(msg.content || '');
      
      fullContext += `${role}: ${cleanContent}\n\n`;
      
      // Log the last message for debugging
      if (index === filteredMessages.length - 1) {
        console.log(`[DefaultContextStrategy] Última mensagem: ${role}: ${cleanContent.substring(0, 100)}...`);
      }
    });
    
    // Add instructions to maintain context
    fullContext += "Importante: Mantenha o contexto e o tom da conversa anterior. Se estiver discutindo tópicos específicos, mantenha o foco nesses tópicos.\n";
    
    console.log(`[DefaultContextStrategy] Contexto final: ${fullContext.length} caracteres`);
    
    return fullContext;
  }
}
