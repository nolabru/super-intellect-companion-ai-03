
import React, { useRef, useEffect, useState } from 'react';
import { Send, Paperclip, Calendar, FileSpreadsheet, FileText, Mail, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMode } from '@/components/ModeSelector';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';
import { toast } from 'sonner';

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

const GOOGLE_COMMANDS = [
  {
    id: 'calendar',
    name: 'Calendário',
    icon: <Calendar className="h-4 w-4 mr-2" />,
    description: 'Criar eventos no Google Calendar',
    command: '@calendar '
  },
  {
    id: 'sheet',
    name: 'Planilhas',
    icon: <FileSpreadsheet className="h-4 w-4 mr-2" />,
    description: 'Ler e escrever dados no Google Sheets',
    command: '@sheet '
  },
  {
    id: 'doc',
    name: 'Documentos',
    icon: <FileText className="h-4 w-4 mr-2" />,
    description: 'Criar ou atualizar documentos Google Docs',
    command: '@doc '
  },
  {
    id: 'drive',
    name: 'Drive',
    icon: <FolderOpen className="h-4 w-4 mr-2" />,
    description: 'Carregar arquivos no Google Drive',
    command: '@drive '
  },
  {
    id: 'email',
    name: 'Email',
    icon: <Mail className="h-4 w-4 mr-2" />,
    description: 'Gerar e enviar e-mails via Gmail',
    command: '@email '
  }
];

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
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandMenuPosition, setCommandMenuPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { isGoogleConnected, loading: googleAuthLoading } = useGoogleAuth();

  const [cursorPosition, setCursorPosition] = useState(0);
  
  useEffect(() => {
    console.log('[MessageInput] Google connection status:', { 
      isGoogleConnected, 
      googleAuthLoading 
    });
  }, [isGoogleConnected, googleAuthLoading]);
  
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  useEffect(() => {
    if (message.length > 0 && cursorPosition > 0) {
      const textBeforeCursor = message.substring(0, cursorPosition);
      const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
      
      if (lastAtSymbol !== -1 && (lastAtSymbol === 0 || message[lastAtSymbol - 1] === ' ')) {
        const textAfterAt = textBeforeCursor.substring(lastAtSymbol + 1);
        
        if (textAfterAt.length === 0 || !textAfterAt.includes(' ')) {
          setShowCommandMenu(true);
          
          if (textareaRef.current && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            setCommandMenuPosition({
              top: -10,
              left: 10,
            });
          }
          return;
        }
      }
    }
    
    setShowCommandMenu(false);
  }, [message, cursorPosition]);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    setCursorPosition(e.target.selectionStart);
    
    // Auto resize the textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(120, Math.max(44, e.target.scrollHeight));
      textareaRef.current.style.height = `${newHeight}px`;
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

  const insertCommand = (command: string) => {
    console.log('[MessageInput] Checking Google connection before inserting command', { 
      isGoogleConnected, 
      googleAuthLoading 
    });
    
    if (!isGoogleConnected) {
      toast.error(
        "Conta Google não conectada", 
        { description: "Para usar comandos do Google, você precisa fazer login com sua conta Google." }
      );
      setShowCommandMenu(false);
      return;
    }

    if (textareaRef.current) {
      const beforeCursor = message.substring(0, cursorPosition);
      const lastAtIndex = beforeCursor.lastIndexOf('@');
      
      if (lastAtIndex !== -1) {
        const newMessage = 
          message.substring(0, lastAtIndex) + 
          command + 
          message.substring(cursorPosition);
        
        setMessage(newMessage);
        
        const newPosition = lastAtIndex + command.length;
        
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(newPosition, newPosition);
            setCursorPosition(newPosition);
          }
        }, 0);
      }
    }
    
    setShowCommandMenu(false);
  };

  return (
    <div ref={containerRef} className="relative rounded-lg border border-inventu-gray/30 bg-inventu-card">
      {showCommandMenu && (
        <div 
          className="absolute -top-[235px] left-0 z-50 w-[300px] bg-inventu-dark border border-inventu-gray/30 rounded-md overflow-hidden shadow-lg"
          style={{
            transform: `translate(${commandMenuPosition.left}px, 0px)`,
          }}
        >
          <div className="p-2 bg-inventu-darker border-b border-inventu-gray/30">
            <p className="text-xs text-inventu-gray">Google Workspace</p>
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {GOOGLE_COMMANDS.map((cmd) => (
              <div 
                key={cmd.id}
                className="flex items-center p-2 hover:bg-inventu-gray/20 cursor-pointer text-white"
                onClick={() => insertCommand(cmd.command)}
              >
                {cmd.icon}
                <div>
                  <p className="text-sm font-medium">{cmd.name}</p>
                  <p className="text-xs text-inventu-gray">{cmd.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <textarea
        ref={textareaRef}
        value={message}
        onChange={handleMessageChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSendMessage();
          }
        }}
        onClick={(e) => {
          if (textareaRef.current) {
            setCursorPosition(textareaRef.current.selectionStart);
          }
        }}
        onKeyUp={(e) => {
          if (textareaRef.current) {
            setCursorPosition(textareaRef.current.selectionStart);
          }
        }}
        placeholder={getPlaceholder()}
        className="w-full pl-4 pr-24 py-3 rounded-lg bg-transparent text-white resize-none overflow-hidden focus:outline-none min-h-[44px]"
        rows={1}
        disabled={isSending}
        style={{ maxHeight: '120px' }}
      />
      <div className="absolute top-1/2 right-3 -translate-y-1/2 flex gap-2">
        {mode !== 'text' && (
          <Button 
            onClick={onAttachment}
            variant="ghost" 
            size="icon"
            className="text-inventu-gray hover:text-white hover:bg-inventu-gray/20 h-10 w-10 flex-shrink-0"
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
          className="text-inventu-gray hover:text-white hover:bg-inventu-gray/20 h-10 w-10 flex-shrink-0"
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
