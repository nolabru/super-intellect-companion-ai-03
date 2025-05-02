
export interface Message {
  id: string;
  content: string;
  role: MessageRole;
  timestamp: string;
  metadata?: any;
}

export type MessageRole = 'user' | 'assistant' | 'system' | 'error';
