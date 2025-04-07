
import React, { useState } from 'react';
import { Book, SettingsIcon, MessagesSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  className?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, className }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className={cn("px-4 py-3 border-t border-inventu-gray/30", className)}>
      <div className="text-sm text-gray-400 mb-2">
        Modo vinculado: ambos os modelos responderão
      </div>
      
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="w-full bg-inventu-card border border-inventu-gray/30 rounded-lg p-4 text-white focus:outline-none focus:ring-2 focus:ring-inventu-blue"
        />
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              className="bg-inventu-card border-inventu-gray/30 hover:bg-inventu-gray/50 text-gray-300 flex items-center gap-2"
            >
              <Book size={18} />
              <span>Modelos</span>
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="bg-inventu-card border-inventu-gray/30 hover:bg-inventu-gray/50 text-gray-300 flex items-center gap-2"
            >
              <SettingsIcon size={18} />
              <span>MCP Tools</span>
            </Button>
            
            <Button
              type="button"
              className="bg-transparent border border-inventu-blue text-inventu-blue hover:bg-inventu-blue/10 flex items-center gap-2"
            >
              <MessagesSquare size={18} />
              <span>Comparar</span>
            </Button>
          </div>
          
          <Button type="submit" className="bg-inventu-blue hover:bg-inventu-darkBlue text-white px-6">
            Enviar
          </Button>
        </div>
        
        <div className="text-xs text-gray-400 mt-2">
          Pressione Ctrl+Enter ou Cmd+Enter para enviar
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
