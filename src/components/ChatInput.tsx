
import React, { useState } from 'react';
import { Link, MessagesSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ModeSelector, { ChatMode } from './ModeSelector';
import { Input } from '@/components/ui/input';

interface ChatInputProps {
  onSendMessage: (message: string, mode: ChatMode, model: string) => void;
  className?: string;
  isLinked: boolean;
  onToggleLink: () => void;
  onToggleCompare: () => void;
  isSplitView: boolean;
  activeModelLeft?: string;
  activeModelRight?: string;
  onModelChangeLeft?: (model: string) => void;
  onModelChangeRight?: (model: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  className,
  isLinked,
  onToggleLink,
  onToggleCompare,
  isSplitView,
  activeModelLeft = 'gpt-4o',
  activeModelRight = 'claude-3-opus',
}) => {
  const [message, setMessage] = useState('');
  const [activeMode, setActiveMode] = useState<ChatMode>('text');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      // Use the appropriate model based on whether we're in split view
      if (isSplitView && !isLinked) {
        // In unlinked mode, we would need to determine which chat to send to
        // For now, we'll just use activeModelLeft as default
        onSendMessage(message, activeMode, activeModelLeft);
      } else {
        // In linked mode or single mode, we use activeModelLeft
        onSendMessage(message, activeMode, activeModelLeft);
      }
      setMessage('');
    }
  };

  // If in split view and not linked, we render two separate inputs
  if (isSplitView && !isLinked) {
    return (
      <div className={cn("px-4 py-3 border-t border-inventu-gray/30 bg-inventu-darker", className)}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-3">
            <ModeSelector activeMode={activeMode} onChange={setActiveMode} />
            
            <Button
              type="button"
              variant="outline"
              className="bg-transparent border border-inventu-blue text-inventu-blue hover:bg-inventu-blue/10 flex items-center gap-2"
              onClick={onToggleLink}
            >
              <Link size={18} />
              <span>Vincular chats</span>
            </Button>
          </div>
          
          <Button
            type="button"
            className={cn(
              "bg-transparent hover:bg-inventu-blue/10 flex items-center gap-2",
              isSplitView ? "border border-inventu-purple text-inventu-purple" : "border border-inventu-blue text-inventu-blue"
            )}
            onClick={onToggleCompare}
          >
            <MessagesSquare size={18} />
            <span>Modo único</span>
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Left chat input */}
          <form onSubmit={handleSubmit} className="relative">
            <Input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="w-full bg-inventu-card border border-inventu-gray/30 rounded-lg pr-14 py-6 text-white focus:outline-none focus:ring-2 focus:ring-inventu-blue"
            />
            <Button 
              type="submit" 
              size="icon"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-inventu-blue hover:bg-inventu-darkBlue text-white rounded-full p-2"
            >
              <Send size={18} />
            </Button>
          </form>
          
          {/* Right chat input */}
          <form onSubmit={handleSubmit} className="relative">
            <Input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="w-full bg-inventu-card border border-inventu-gray/30 rounded-lg pr-14 py-6 text-white focus:outline-none focus:ring-2 focus:ring-inventu-blue"
            />
            <Button 
              type="submit" 
              size="icon"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-inventu-blue hover:bg-inventu-darkBlue text-white rounded-full p-2"
            >
              <Send size={18} />
            </Button>
          </form>
        </div>
        
        <div className="text-xs text-gray-400 mt-2">
          Pressione Ctrl+Enter ou Cmd+Enter para enviar
        </div>
      </div>
    );
  }

  // For single view or linked chats
  return (
    <div className={cn("px-4 py-3 border-t border-inventu-gray/30 bg-inventu-darker", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex space-x-3 items-center">
          <ModeSelector activeMode={activeMode} onChange={setActiveMode} />
        </div>
        
        <div className="flex items-center space-x-3">
          {isSplitView && (
            <Button
              type="button"
              variant="outline"
              className="bg-transparent border border-inventu-blue text-inventu-blue hover:bg-inventu-blue/10 flex items-center gap-2"
              onClick={onToggleLink}
            >
              <Link size={18} />
              <span>Desvincular</span>
            </Button>
          )}
          
          <Button
            type="button"
            className={cn(
              "bg-transparent hover:bg-inventu-blue/10 flex items-center gap-2",
              isSplitView ? "border border-inventu-purple text-inventu-purple" : "border border-inventu-blue text-inventu-blue"
            )}
            onClick={onToggleCompare}
          >
            <MessagesSquare size={18} />
            <span>{isSplitView ? "Modo único" : "Comparar"}</span>
          </Button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="relative">
        <Input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="w-full bg-inventu-card border border-inventu-gray/30 rounded-lg pr-14 py-6 text-white focus:outline-none focus:ring-2 focus:ring-inventu-blue"
        />
        <Button 
          type="submit" 
          size="icon"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-inventu-blue hover:bg-inventu-darkBlue text-white rounded-full p-2"
        >
          <Send size={18} />
        </Button>
      </form>
      
      <div className="text-xs text-gray-400 mt-2">
        Pressione Ctrl+Enter ou Cmd+Enter para enviar
      </div>
    </div>
  );
};

export default ChatInput;
