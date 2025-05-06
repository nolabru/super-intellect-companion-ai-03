import { ChatMode } from '@/components/ModeSelector';

export interface ConversationType {
  id: string;
  created_at: string;
  title: string;
  user_id?: string;
  last_message?: string;
  pinned?: boolean;
  model?: string;
  mode?: ChatMode;
  params?: any;
}
