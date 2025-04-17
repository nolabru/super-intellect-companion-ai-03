
import { MessageType } from '@/components/ChatMessage';

/**
 * Interface for a message in the conversation context
 * Reuses the existing MessageType for consistency
 */
export type ContextMessage = MessageType;

/**
 * Parameters for context building
 */
export interface ContextParams {
  // Maximum number of messages to include in context
  maxMessages?: number;
  
  // Whether to include user memory in context
  includeUserMemory?: boolean;
  
  // Model ID to build context for
  modelId?: string;
  
  // Chat mode (text, image, video, etc.)
  mode?: string;
  
  // User ID for retrieving personalized context
  userId?: string;
  
  // Conversation ID for retrieving conversation history
  conversationId?: string;
  
  // Whether to include model information in context formatting
  includeModelInfo?: boolean;
}

/**
 * User memory item structure
 */
export interface UserMemory {
  // Unique identifier for the memory item
  id: string;
  
  // User ID that owns this memory
  userId: string;
  
  // Key name for the memory (e.g., "favorite_color", "home_address")
  keyName: string;
  
  // Value of the memory
  value: string;
  
  // Optional title for the memory
  title?: string;
  
  // Source of the memory (e.g., "conversation", "user_input")
  source?: string;
  
  // When the memory was created
  createdAt: string;
  
  // When the memory was last updated
  updatedAt: string;
}

/**
 * Result of the context processing
 */
export interface ContextResult {
  // Formatted context string ready to be sent to the model
  formattedContext: string;
  
  // Length of the context in characters
  contextLength: number;
  
  // Messages that were included in the context
  includedMessages: ContextMessage[];
  
  // Memory items that were included in the context
  includedMemory: UserMemory[];
  
  // Model that the context was formatted for
  targetModel?: string;
  
  // Strategy used to format the context
  strategyUsed?: string;
  
  // Whether memory was included
  memoryIncluded: boolean;
  
  // Metrics about the context (token count, processing time, etc.)
  metrics?: {
    processingTimeMs?: number;
    estimatedTokenCount?: number;
    [key: string]: any;
  };
}
