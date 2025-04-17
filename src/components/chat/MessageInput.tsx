
import React, { useRef, useEffect, useState } from 'react';
import { Send, Paperclip, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMode } from '@/components/ModeSelector';
import GoogleServicesAutocomplete from './GoogleServicesAutocomplete';
import { identifyGoogleAgent } from '@/agents/GoogleAgents';

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
  const [isGoogleCommand, setIsGoogleCommand] = useState(false);
  
  // Detectar o comando Google ativo
  useEffect(() => {
    const isCommand = !!identifyGoogleAgent(message);
    setIsGoogleCommand(isCommand);
  }, [message]);
  
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

  // Extrair qual serviço está sendo usado
  const getGoogleServiceType = () => {
    if (message.trim().startsWith('@drive')) return 'Google Drive';
    if (message.trim().startsWith('@sheet')) return 'Google Sheets';
    if (message.trim().startsWith('@calendar')) return 'Google Calendar';
    return '';
  };

  return (
    <div className="relative rounded-lg border border-inventu-gray/30 bg-inventu-card">
      {/* Google Command Indicator */}
      {isGoogleCommand && (
        <div className="absolute -top-12 left-0 right-0 p-2 bg-blue-500/20 border border-blue-500/30 rounded-md text-sm">
          <span className="font-semibold">Modo Serviço Google:</span> {getGoogleServiceType()}
          <p className="text-xs text-inventu-gray mt-1">
            Forneça detalhes do que deseja criar, como título e conteúdo
          </p>
        </div>
      )}
      
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
            // Use direct string concatenation instead of function update
            setMessage(message + '@');
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
