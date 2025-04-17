
import { ChatMode } from '@/components/ModeSelector';

/**
 * Message object for context processing
 */
export interface ContextMessage {
  id: string;
  content?: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  model?: string;
  mode?: ChatMode;
  loading?: boolean;
  error?: boolean;
  files?: string[];
  mediaUrl?: string;
  streaming?: boolean;
}

/**
 * Memory item for user-specific context
 */
export interface UserMemory {
  id: string;
  keyName: string;
  value: string;
  title?: string;
  source?: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Parameters for context building
 */
export interface ContextParams {
  conversationId: string;
  modelId: string;
  mode: string;
  userId?: string;
  includeUserMemory: boolean;
  includeModelInfo: boolean;
  maxMessages: number;
  startTime?: string;
  endTime?: string;
}

/**
 * Result of context building process
 */
export interface ContextResult {
  formattedContext: string;
  contextLength: number;
  includedMessages: ContextMessage[];
  includedMemory: UserMemory[];
  targetModel: string;
  strategyUsed: string;
  memoryIncluded: boolean;
  metrics: {
    processingTimeMs: number;
    estimatedTokenCount: number;
  };
}

/**
 * Information about processed context
 */
export interface ProcessedContextInfo {
  contextLength: number;
  includedMessageIds: string[];
  strategyUsed: string;
  processingTimeMs: number;
}
