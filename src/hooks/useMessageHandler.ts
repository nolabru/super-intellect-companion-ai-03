
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Message, MessageType, ChatMode } from '@/types/chat';
import { useMediaHandling } from '@/hooks/useMediaHandling';

export function useMessageHandler() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<ChatMode>(ChatMode.TEXT);
  const [currentModel, setCurrentModel] = useState('gpt-4o');
  
  const { 
    files, 
    filePreviewUrls, 
    isMediaUploading,
    handleFileChange, 
    removeFile, 
    clearFiles,
    uploadFiles 
  } = useMediaHandling();
  
  const addMessage = useCallback((content: string, role: MessageType = 'user', metadata?: any) => {
    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      content,
      role,
      timestamp: Date.now(),
      ...(metadata && { metadata })
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    );
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  const handleModeChange = useCallback((mode: ChatMode) => {
    setCurrentMode(mode);
    clearFiles();
  }, [clearFiles]);
  
  const handleModelChange = useCallback((modelId: string) => {
    setCurrentModel(modelId);
  }, []);
  
  const handleFileUpload = useCallback((file: File): boolean => {
    return handleFileChange(file, currentMode);
  }, [handleFileChange, currentMode]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    clearFiles();
  }, [clearFiles]);

  return {
    messages,
    isLoading,
    setIsLoading,
    currentMode,
    currentModel,
    files,
    filePreviewUrls,
    isMediaUploading,
    addMessage,
    updateMessage,
    deleteMessage,
    handleModeChange,
    handleModelChange,
    handleFileUpload,
    removeFile,
    clearFiles,
    clearMessages,
    uploadFiles
  };
}
