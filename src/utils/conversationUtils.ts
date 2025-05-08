
import { MessageType } from '@/components/ChatMessage';
import { toast } from 'sonner';
import { ConversationType, DbOperationResult } from '@/types/conversation';

// Mock functions that replace backend functionality

export const saveMessageToDatabase = async (message: MessageType, conversationId: string): Promise<DbOperationResult> => {
  console.log('Mock: Saving message to database', message, conversationId);
  // Return a successful mock response
  return { data: message, error: null, success: true };
};

export const loadUserConversations = async (): Promise<DbOperationResult<ConversationType[]>> => {
  console.log('Mock: Loading user conversations');
  // Return empty array as mock data
  return { data: [], error: null };
};

export const loadConversationMessages = async (conversationId: string): Promise<DbOperationResult> => {
  console.log('Mock: Loading conversation messages', conversationId);
  // Return empty array as mock data
  return { data: [], error: null };
};

export const createConversation = async (): Promise<DbOperationResult<ConversationType>> => {
  console.log('Mock: Creating new conversation');
  const mockConversation: ConversationType = {
    id: 'mock-' + Date.now(),
    title: 'Nova Conversa',
    user_id: 'mock-user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  toast.success('Nova conversa criada (simulado)');
  return { data: mockConversation, error: null, success: true };
};

export const deleteConversation = async (id: string): Promise<DbOperationResult> => {
  console.log('Mock: Deleting conversation', id);
  toast.success('Conversa excluída com sucesso (simulado)');
  return { data: null, error: null, success: true };
};

export const renameConversation = async (id: string, newTitle: string): Promise<DbOperationResult> => {
  console.log('Mock: Renaming conversation', id, newTitle);
  toast.success('Conversa renomeada com sucesso (simulado)');
  return { success: true, error: null, data: null };
};

export const updateConversationTitle = async (
  conversationId: string, 
  content: string, 
  conversations: ConversationType[]
): Promise<DbOperationResult<{newTitle: string}>> => {
  console.log('Mock: Updating conversation title', conversationId, content);
  return { 
    success: true, 
    data: { newTitle: content.substring(0, 30) + '...' }, 
    error: null 
  };
};
