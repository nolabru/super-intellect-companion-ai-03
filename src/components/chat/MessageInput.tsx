
import React, { useRef, useEffect, useState } from 'react';
import { Send, Paperclip, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMode } from '@/components/ModeSelector';
import GoogleServicesAutocomplete from './GoogleServicesAutocomplete';

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
  const [showGoogleServices, setShowGoogleServices] = useState(false);
  
  // Check if @ was just typed to show autocomplete
  useEffect(() => {
    // Get the last word being typed
    const words = message.split(/\s/);
    const lastWord = words[words.length - 1];
    
    if (lastWord === '@') {
      setShowGoogleServices(true);
    } else if (lastWord && !lastWord.startsWith('@')) {
      setShowGoogleServices(false);
    }
  }, [message]);

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
    if (mode === 'audio') {
      return "Digite o texto para converter em áudio...";
    }
    if (model) {
      return `Pergunte ao ${model}... ou use @drive, @sheet, @calendar`;
    }
    return "Digite sua mensagem... ou use @drive, @sheet, @calendar";
  };

  const handleSelectGoogleService = (service: string) => {
    // Replace the @ with the selected service
    const words = message.split(/\s/);
    words[words.length - 1] = `${service} `;
    setMessage(words.join(' '));
    setShowGoogleServices(false);
    
    // Focus the textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

  return (
    <div className="relative rounded-lg border border-inventu-gray/30 bg-inventu-card">
      {/* Google Services Autocomplete */}
      <GoogleServicesAutocomplete 
        visible={showGoogleServices} 
        onSelect={handleSelectGoogleService} 
      />
      
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSendMessage();
          }
        }}
        placeholder={getPlaceholder()}
        className="w-full pl-4 pr-20 py-2 rounded-lg bg-transparent text-white resize-none overflow-hidden focus:outline-none"
        rows={1}
        disabled={isSending}
      />
      <div className="absolute top-1/2 right-3 -translate-y-1/2 flex gap-2">
        {/* Add Google services button */}
        <Button 
          onClick={() => {
            setMessage(prev => prev + '@');
            setShowGoogleServices(true);
          }}
          variant="ghost" 
          size="icon"
          className="text-inventu-gray hover:text-white hover:bg-inventu-gray/20"
          title="Serviços Google"
          disabled={isSending}
        >
          <AtSign className="h-5 w-5" />
        </Button>
        
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
