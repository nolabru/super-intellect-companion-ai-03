
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Clipboard, 
  Link as LinkIcon, 
  Link2Off, 
  FileImage, 
  Mic, 
  Video, 
  TextCursor,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ModeSelector, { ChatMode } from './ModeSelector';
import ModelSelector from './ModelSelector';
import CompareModelsButton from './CompareModelsButton';
import { toast } from '@/components/ui/use-toast';

interface ChatInputProps {
  onSendMessage: (message: string, mode: ChatMode, model: string) => void;
  isLinked: boolean;
  onToggleLink: () => void;
  onToggleCompare: () => void;
  isSplitView: boolean;
  activeModelLeft: string;
  activeModelRight: string;
  onModelChangeLeft: (model: string) => void;
  onModelChangeRight: (model: string) => void;
  onToggleSidebar?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  isLinked, 
  onToggleLink, 
  onToggleCompare, 
  isSplitView,
  activeModelLeft,
  activeModelRight,
  onModelChangeLeft,
  onModelChangeRight,
  onToggleSidebar
}) => {
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<ChatMode>('text');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message, mode, isSplitView ? activeModelLeft : activeModelLeft);
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
      <div className="flex flex-col md:flex-row gap-2">
        <div className="flex md:flex-1 gap-2 items-center">
          {onToggleSidebar && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={onToggleSidebar}
              className="text-inventu-gray hover:text-white hover:bg-inventu-gray/20"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <ModeSelector activeMode={mode} onChange={setMode} />
          
          {isSplitView ? (
            <>
              <ModelSelector selectedModel={activeModelLeft} onChange={onModelChangeLeft} mode={mode} />
              {isLinked && <LinkIcon className="h-5 w-5 text-inventu-gray" />}
              {!isLinked && <Link2Off className="h-5 w-5 text-inventu-gray" />}
              <Button 
                onClick={onToggleLink} 
                variant="ghost" 
                size="icon"
                className="text-inventu-gray hover:text-white hover:bg-inventu-gray/20"
              >
                {isLinked ? <LinkIcon className="h-5 w-5" /> : <Link2Off className="h-5 w-5" />}
              </Button>
              <ModelSelector selectedModel={activeModelRight} onChange={onModelChangeRight} mode={mode} />
            </>
          ) : (
            <ModelSelector selectedModel={activeModelLeft} onChange={onModelChangeLeft} mode={mode} />
          )}
        </div>
        
        <CompareModelsButton isComparing={isSplitView} onToggleCompare={onToggleCompare} />
      </div>
      
      <div className="mt-2 relative">
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
