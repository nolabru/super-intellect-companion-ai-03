
import { ChatMode } from '@/components/ModeSelector';

export interface ConversationType {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  user_id?: string;
  last_message?: string;
  pinned?: boolean;
  model?: string;
  mode?: ChatMode;
  params?: any;
}

export interface ConversationState {
  conversations: ConversationType[];
  currentConversationId: string | null;
  loading: boolean;
  error: string | null;
}

export interface DbOperationResult<T = any> {
  data: T | null;
  error: string | null;
  success?: boolean;
}
