
import React, { useState } from 'react';
import { Book, Link, MessagesSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ModeSelector, { ChatMode } from './ModeSelector';
import ModelSelector from './ModelSelector';

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
  onModelChangeLeft,
  onModelChangeRight
}) => {
  const [message, setMessage] = useState('');
  const [activeMode, setActiveMode] = useState<ChatMode>('text');
  const [activeModel, setActiveModel] = useState('gpt-4o');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message, activeMode, activeModel);
      setMessage('');
    }
  };

  // If in split view and not linked, we render two separate inputs
  if (isSplitView && !isLinked) {
    return (
      <div className={cn("px-4 py-3 border-t border-inventu-gray/30", className)}>
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
              isSplitView ? "border border-inventu-blue text-inventu-blue" : "text-gray-400"
            )}
            onClick={onToggleCompare}
          >
            <MessagesSquare size={18} />
            <span>Comparar</span>
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Left model input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <ModelSelector 
                mode={activeMode} 
                selectedModel={activeModelLeft} 
                onChange={onModelChangeLeft || (() => {})}
                className="w-48 bg-inventu-card text-white"
              />
            </div>
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="w-full bg-inventu-card border border-inventu-gray/30 rounded-lg p-4 text-white focus:outline-none focus:ring-2 focus:ring-inventu-blue"
              />
              <Button 
                type="submit" 
                className="absolute right-2 bottom-2 bg-inventu-blue hover:bg-inventu-darkBlue text-white"
              >
                Enviar
              </Button>
            </form>
          </div>
          
          {/* Right model input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <ModelSelector 
                mode={activeMode} 
                selectedModel={activeModelRight} 
                onChange={onModelChangeRight || (() => {})}
                className="w-48 bg-inventu-card text-white"
              />
            </div>
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="w-full bg-inventu-card border border-inventu-gray/30 rounded-lg p-4 text-white focus:outline-none focus:ring-2 focus:ring-inventu-blue"
              />
              <Button 
                type="submit" 
                className="absolute right-2 bottom-2 bg-inventu-blue hover:bg-inventu-darkBlue text-white"
              >
                Enviar
              </Button>
            </form>
          </div>
        </div>
        
        <div className="text-xs text-gray-400 mt-2">
          Pressione Ctrl+Enter ou Cmd+Enter para enviar
        </div>
      </div>
    );
  }

  // For single view or linked chats
  return (
    <div className={cn("px-4 py-3 border-t border-inventu-gray/30", className)}>
      {isSplitView && (
        <div className="text-sm text-gray-400 mb-2">
          Modo vinculado: ambos os modelos responderão
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="w-full bg-inventu-card border border-inventu-gray/30 rounded-lg p-4 text-white focus:outline-none focus:ring-2 focus:ring-inventu-blue"
        />
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex space-x-3">
            <ModeSelector activeMode={activeMode} onChange={setActiveMode} />
            
            <ModelSelector 
              mode={activeMode} 
              selectedModel={activeModel} 
              onChange={setActiveModel}
              className="w-48 bg-inventu-card text-white border-inventu-gray/30"
            />
            
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
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              type="button"
              className={cn(
                "bg-transparent hover:bg-inventu-blue/10 flex items-center gap-2",
                isSplitView ? "border border-inventu-blue text-inventu-blue" : "text-gray-400"
              )}
              onClick={onToggleCompare}
            >
              <MessagesSquare size={18} />
              <span>Comparar</span>
            </Button>
            
            <Button type="submit" className="bg-inventu-blue hover:bg-inventu-darkBlue text-white px-6">
              Enviar
            </Button>
          </div>
        </div>
        
        <div className="text-xs text-gray-400 mt-2">
          Pressione Ctrl+Enter ou Cmd+Enter para enviar
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
