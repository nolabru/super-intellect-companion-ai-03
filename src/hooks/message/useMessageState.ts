
import { useState, useEffect } from 'react';
import { MessageType } from '@/components/ChatMessage';

export function useMessageState() {
  const [isSending, setIsSending] = useState(false);
  const [lastMessageSent, setLastMessageSent] = useState<string | null>(null);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState<number>(0);

  const canSendMessage = (content: string): boolean => {
    const now = Date.now();
    if (content === lastMessageSent && now - lastMessageTimestamp < 2000) {
      return false;
    }
    return true;
  };

  const updateLastMessage = (content: string) => {
    setLastMessageSent(content);
    setLastMessageTimestamp(Date.now());
  };

  return {
    isSending,
    setIsSending,
    canSendMessage,
    updateLastMessage
  };
}
