
import { ChatMode } from '@/components/ModeSelector';
import { LumaParams } from '@/components/LumaParamsButton';

// Interface definition for conversation type
export interface ConversationType {
  id: string;
  title: string;
  updated_at: string;
  user_id: string;
  created_at?: string;
}

// Interface for API response
export interface MessageResponse {
  content: string;
  files?: string[];
  error?: string;
}

// Interface for database operations results
export interface DbOperationResult<T = any> {
  data: T | null;
  error: string | null;
  success?: boolean;
}

// Interface for conversation selection event
export interface ConversationSelectionEvent {
  conversationId: string;
  clearMessages: boolean;
}

// Interface for conversation state
export interface ConversationState {
  conversations: ConversationType[];
  currentConversationId: string | null;
  loading: boolean;
  error: string | null;
}
