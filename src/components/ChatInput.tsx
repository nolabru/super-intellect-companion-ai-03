
import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  model?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, model }) => {
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

  const handleAttachment = () => {
    toast({
      title: "Informação",
      description: "Funcionalidade de anexo em desenvolvimento.",
    });
  };

  return (
    <div className="relative mt-3">
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
        placeholder={model ? `Pergunte ao ${model}...` : "Digite sua mensagem..."}
        className="w-full pl-4 pr-20 py-2 rounded-lg border border-inventu-gray/30 bg-inventu-card text-white resize-none overflow-hidden focus:outline-none focus:border-inventu-blue"
        rows={1}
      />
      <div className="absolute top-1/2 right-3 -translate-y-1/2 flex gap-2">
        <Button 
          onClick={handleAttachment}
          variant="ghost" 
          size="icon"
          className="text-inventu-gray hover:text-white hover:bg-inventu-gray/20"
        >
          <Paperclip className="h-5 w-5" />
        </Button>
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
  );
};

export default ChatInput;
