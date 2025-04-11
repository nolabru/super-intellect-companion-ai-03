
import React, { useRef, useEffect, useState } from 'react';
import { Send, Paperclip, Mic, Image, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMode } from '@/components/ModeSelector';
import { cn } from '@/lib/utils';

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
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const getPlaceholder = () => {
    if (isImageGenerationModel) {
      return "Descreva a imagem que você deseja gerar...";
    }
    if (model) {
      return `Pergunte ao ${model}...`;
    }
    return "Digite sua mensagem...";
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (!isTyping && e.target.value) {
      setIsTyping(true);
    } else if (isTyping && !e.target.value) {
      setIsTyping(false);
    }
  };

  const handleSendClick = () => {
    if (message.trim() !== '') {
      onSendMessage();
      setIsTyping(false);
    }
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'image':
        return <Image className="h-4 w-4 mr-1" />;
      case 'video':
        return <Video className="h-4 w-4 mr-1" />;
      case 'audio':
        return <Mic className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "relative rounded-lg border border-inventu-gray/30 bg-inventu-card transition-all",
      isTyping ? "border-inventu-blue/50 shadow-sm" : "",
      isSending ? "opacity-80" : ""
    )}>
      <textarea
        ref={textareaRef}
        value={message}
        onChange={handleInputChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendClick();
          }
        }}
        placeholder={getPlaceholder()}
        className="w-full pl-4 pr-20 py-3 rounded-lg bg-transparent text-white resize-none overflow-hidden focus:outline-none transition-all"
        rows={1}
        disabled={isSending}
      />
      
      {mode !== 'text' && (
        <div className="absolute top-1 left-2 flex items-center px-2 py-1 text-xs text-inventu-gray/70 bg-inventu-dark/40 rounded-full">
          {getModeIcon()}
          <span className="capitalize">{mode}</span>
        </div>
      )}
      
      <div className="absolute top-1/2 right-3 -translate-y-1/2 flex gap-2">
        {mode !== 'text' && (
          <Button 
            onClick={onAttachment}
            variant="ghost" 
            size="icon"
            className={cn(
              "text-inventu-gray hover:text-white hover:bg-inventu-gray/20 transition-all", 
              isSending ? "opacity-50 cursor-not-allowed" : ""
            )}
            title={`Anexar ${mode}`}
            disabled={isSending}
          >
            <Paperclip className={cn("h-5 w-5", isSending ? "" : "hover:scale-110 transition-transform")} />
          </Button>
        )}
        
        <Button 
          onClick={handleSendClick}
          variant="ghost" 
          size="icon"
          className={cn(
            "text-inventu-gray hover:text-white hover:bg-inventu-gray/20 transition-all",
            message.trim() !== '' ? "text-inventu-blue" : "",
            isSending ? "opacity-50 cursor-not-allowed" : ""
          )}
          disabled={isSending || message.trim() === ''}
        >
          <Send className={cn(
            "h-5 w-5", 
            isSending ? "animate-pulse" : "hover:scale-110 transition-transform",
            message.trim() !== '' ? "text-inventu-blue" : ""
          )} />
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
