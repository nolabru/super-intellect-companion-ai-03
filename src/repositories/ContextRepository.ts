
import { ContextMessage, ContextParams } from '@/services/context/types/ContextTypes';

/**
 * Repository interface for accessing conversation messages
 */
export interface ContextRepository {
  /**
   * Get messages for a specific conversation
   * @param conversationId - ID of the conversation
   * @param params - Optional parameters for filtering messages
   * @returns Promise of conversation messages
   */
  getMessagesForConversation(
    conversationId: string,
    params?: {
      limit?: number;
      offset?: number;
      startTime?: string;
      endTime?: string;
    }
  ): Promise<ContextMessage[]>;
  
  /**
   * Get the most recent messages
   * @param limit - Maximum number of messages to return
   * @param params - Optional filtering parameters
   * @returns Promise of messages
   */
  getRecentMessages(
    limit: number,
    params?: {
      userId?: string;
      modelId?: string;
      mode?: string;
    }
  ): Promise<ContextMessage[]>;
  
  /**
   * Save a processed message context
   * @param messageId - ID of the message
   * @param contextInfo - Information about the context that was built
   * @returns Promise of success
   */
  saveProcessedContext(
    messageId: string,
    contextInfo: {
      contextLength: number;
      includedMessageIds: string[];
      strategyUsed: string;
      processingTimeMs: number;
    }
  ): Promise<boolean>;
  
  /**
   * Search messages for relevant context
   * @param query - Search terms
   * @param params - Search parameters
   * @returns Promise of relevant messages
   */
  searchRelevantMessages(
    query: string,
    params?: {
      userId?: string;
      limit?: number;
      threshold?: number;
    }
  ): Promise<ContextMessage[]>;
}
