
import { ChatMode } from '@/components/ModeSelector';
import { LumaParams } from '@/components/LumaParamsButton';

// Interface definition for conversation type
export interface ConversationType {
  id: string;
  title: string;
  updated_at: string;
  user_id: string;
}

// Interface for API response
export interface MessageResponse {
  content: string;
  files?: string[];
  error?: string;
}
