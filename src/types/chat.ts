
export type MessageType = 'user' | 'assistant' | 'system' | 'error' | 'loading';
export type MessageRole = 'user' | 'assistant' | 'system' | 'error' | 'loading';

export interface Message {
  id: string;
  role: MessageType;
  content: string;
  timestamp: number;
  isLoading?: boolean;
  files?: string[];
}

export enum ChatMode {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  CODE = 'code'
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  currentMode: ChatMode;
  currentModel: string;
}
