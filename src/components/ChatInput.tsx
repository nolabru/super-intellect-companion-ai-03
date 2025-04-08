
import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } else {
      toast({
        title: "Alerta",
        description: "Por favor, insira uma mensagem.",
      });
    }
  };

  return (
    <div className="border-t border-inventu-gray/30 p-4 bg-inventu-dark">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Digite sua mensagem..."
          className="w-full pl-4 pr-12 py-2 rounded-lg border border-inventu-gray/30 bg-inventu-card text-white resize-none overflow-hidden focus:outline-none focus:border-inventu-blue"
          rows={1}
        />
        <div className="absolute top-1/2 right-3 -translate-y-1/2 flex gap-2">
          <Button 
            onClick={handleSendMessage}
            variant="ghost" 
            size="icon"
            className="text-inventu-gray hover:text-white hover:bg-inventu-gray/20"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
