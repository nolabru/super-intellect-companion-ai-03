import React, { useRef, useEffect, useState } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMode } from '@/components/ModeSelector';
import { CommandMenu } from './CommandMenu';

interface MessageInputProps {
  message: string;
  setMessage: (message: string) => void;
  onSendMessage: () => void;
  onAttachment: () => void;
  isImageGenerationModel: boolean;
  isSending: boolean;
  mode: ChatMode;
  model: string;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  message, 
  setMessage, 
  onSendMessage, 
  onAttachment, 
  isImageGenerationModel,
  isSending,
  mode,
  model
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commandTriggerRef = useRef<HTMLSpanElement>(null);
  const [showCommands, setShowCommands] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleCommandSelect = (command: string) => {
    if (cursorPosition !== null) {
      const beforeCommand = message.slice(0, cursorPosition - 1); // Remove the @
      const afterCommand = message.slice(cursorPosition);
      setMessage(beforeCommand + command + ' ' + afterCommand);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Check for @ symbol
    const curPos = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, curPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1 && (lastAtSymbol === 0 || value[lastAtSymbol - 1] === ' ')) {
      setShowCommands(true);
      setCursorPosition(curPos);
    } else {
      setShowCommands(false);
    }
  };

  const getPlaceholder = () => {
    if (isImageGenerationModel) {
      return "Descreva a imagem que você deseja gerar...";
    }
    if (mode === 'audio') {
      return "Digite o texto para converter em áudio...";
    }
    if (model) {
      return `Pergunte ao ${model}...`;
    }
    return "Digite sua mensagem...";
  };

  return (
    <div className="relative rounded-lg border border-inventu-gray/30 bg-inventu-card">
      <textarea
        ref={textareaRef}
        value={message}
        onChange={handleInput}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSendMessage();
          }
          if (e.key === 'Escape') {
            setShowCommands(false);
          }
        }}
        placeholder={getPlaceholder()}
        className="w-full pl-4 pr-20 py-2 rounded-lg bg-transparent text-white resize-none overflow-hidden focus:outline-none"
        rows={1}
        disabled={isSending}
      />
      
      <CommandMenu
        isOpen={showCommands}
        onClose={() => setShowCommands(false)}
        onSelect={handleCommandSelect}
        triggerRef={commandTriggerRef}
      />

      <div className="absolute top-1/2 right-3 -translate-y-1/2 flex gap-2">
        {mode !== 'text' && (
          <Button 
            onClick={onAttachment}
            variant="ghost" 
            size="icon"
            className="text-inventu-gray hover:text-white hover:bg-inventu-gray/20"
            title={`Anexar ${mode}`}
            disabled={isSending}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
        )}
        
        <Button 
          onClick={onSendMessage}
          variant="ghost" 
          size="icon"
          className="text-inventu-gray hover:text-white hover:bg-inventu-gray/20"
          disabled={isSending}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={
          mode === 'image' ? 'image/*' : 
          mode === 'video' ? 'video/*' : 
          mode === 'audio' ? 'audio/*' : 
          ''
        }
      />
    </div>
  );
};

export default MessageInput;
