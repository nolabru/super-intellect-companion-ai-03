
import { ContextMessage } from '../types/ContextTypes';

/**
 * Interface for context processors that analyze messages
 */
export interface ContextProcessor {
  /**
   * Determines if this processor can handle the given message
   * @param message - Message to check
   * @returns Whether this processor can handle the message
   */
  canProcess(message: ContextMessage): boolean;
  
  /**
   * Process a message to extract context information
   * @param message - Message to process
   * @returns Processed data and metadata
   */
  process(message: ContextMessage): Promise<{
    processedContent: string;
    entities?: string[];
    relevanceScore: number;
    metadata?: Record<string, any>;
  }>;
}
