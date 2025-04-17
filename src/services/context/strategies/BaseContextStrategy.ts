
import { ContextMessage, UserMemory, ContextParams } from '../types/ContextTypes';
import { ContextStrategy } from './ContextStrategy';

/**
 * Abstract base class for context strategies
 * Implements common formatting functionality
 */
export abstract class BaseContextStrategy implements ContextStrategy {
  /**
   * Check if this strategy can handle the given model and mode
   * @param modelId - Model identifier
   * @param mode - Chat mode
   */
  abstract canHandle(modelId: string, mode: string): boolean;
  
  /**
   * Format context for a specific model
   * @param messages - Messages to include in context
   * @param userMemory - User memory items to include
   * @param params - Context parameters
   */
  abstract formatForModel(
    messages: ContextMessage[],
    userMemory: UserMemory[],
    params: ContextParams
  ): string;
  
  /**
   * Filter messages for context based on parameters
   * @param messages - All available messages
   * @param maxMessages - Maximum number of messages to include
   * @returns Filtered messages
   */
  protected filterMessagesForContext(
    messages: ContextMessage[], 
    maxMessages = 30
  ): ContextMessage[] {
    if (!messages || messages.length === 0) {
      console.log('[BaseContextStrategy] No messages to filter');
      return [];
    }
    
    // Get the most recent messages up to maxMessages
    const recentMessages = messages.slice(-maxMessages);
    
    // Filter out invalid or special messages
    const filteredMessages = recentMessages.filter(msg => {
      const isValidSender = msg.sender === 'user' || msg.sender === 'assistant';
      const isNotSpecialMessage = !msg.loading && !msg.error && !msg.streaming;
      return isValidSender && isNotSpecialMessage;
    });
    
    console.log(`[BaseContextStrategy] Filtered to ${filteredMessages.length} messages`);
    return filteredMessages;
  }
  
  /**
   * Format user memory into a context string
   * @param memory - User memory items
   * @param formatType - Level of detail for formatting
   * @returns Formatted memory context
   */
  protected formatMemoryContext(
    memory: UserMemory[],
    formatType: 'detailed' | 'concise' = 'concise'
  ): string {
    if (!memory || memory.length === 0) {
      return '';
    }
    
    let memoryContext = "Informações importantes sobre o usuário:\n\n";
    
    if (formatType === 'detailed') {
      memory.forEach(item => {
        memoryContext += `${item.title || item.keyName}: ${item.value}\n`;
        if (item.source) {
          memoryContext += `(Fonte: ${item.source})\n`;
        }
        memoryContext += '\n';
      });
    } else {
      // Concise format
      memoryContext += memory
        .map(item => `- ${item.title || item.keyName}: ${item.value}`)
        .join('\n');
    }
    
    console.log(`[BaseContextStrategy] Formatted memory context with ${memory.length} items`);
    return memoryContext;
  }
  
  /**
   * Clean content for context inclusion
   * @param content - Raw content
   * @returns Cleaned content
   */
  protected cleanContentForContext(content: string): string {
    return content
      .replace(/data:image\/[^;]+;base64,[^\s]{100,}/g, '[IMAGEM]')
      .replace(/(https?:\/\/[^\s]{50,})/g, '[URL]')
      .replace(/```[\s\S]{500,}```/g, '[BLOCO DE CÓDIGO]')
      .trim();
  }
}
