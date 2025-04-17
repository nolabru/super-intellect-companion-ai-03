
import { ContextMessage, UserMemory, ContextParams } from '../types/ContextTypes';

/**
 * Interface for context strategies that format context for different models
 */
export interface ContextStrategy {
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
  ): string;
  
  /**
   * Check if this strategy can handle the given model and mode
   * @param modelId - Model identifier
   * @param mode - Chat mode
   * @returns Whether this strategy can handle the combination
   */
  canHandle(modelId: string, mode: string): boolean;
}
