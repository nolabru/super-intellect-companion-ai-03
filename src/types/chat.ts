
import { ChatMode } from '@/components/ModeSelector';
import { MessageType } from '@/components/ChatMessage';

export interface ChatProps {
  model: string;
  messages: MessageType[];
  isTyping?: boolean;
  mode?: ChatMode;
  onSendMessage?: (message: string, files?: string[], params?: any) => void;
}
