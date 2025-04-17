
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

  // Track cursor position to show @ menu
  const [cursorPosition, setCursorPosition] = useState(0);
  
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Handle @ command detection
  useEffect(() => {
    // Check if the character at cursor position - 1 is @
    if (message.length > 0 && cursorPosition > 0) {
      // Get text from the start of the line up to the cursor
      const textBeforeCursor = message.substring(0, cursorPosition);
      const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
      
      // Check if there's an @ symbol and it's either at the start of the line or preceded by a space
      if (lastAtSymbol !== -1 && (lastAtSymbol === 0 || message[lastAtSymbol - 1] === ' ')) {
        // Check if there's anything typed after @
        const textAfterAt = textBeforeCursor.substring(lastAtSymbol + 1);
        
        // Only show menu if there's nothing after @ or if it's a partial command
        if (textAfterAt.length === 0 || !textAfterAt.includes(' ')) {
          setShowCommandMenu(true);
          
          // Position the menu above the input near the @ symbol
          if (textareaRef.current && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            setCommandMenuPosition({
              top: -10, // Position above the textarea
              left: 10, // A small offset from the left
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
    // Verificar mais claramente o status da conexão Google
    console.log('Checking Google connection before inserting command', { 
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
      // Find the last @ in the text before cursor
      const beforeCursor = message.substring(0, cursorPosition);
      const lastAtIndex = beforeCursor.lastIndexOf('@');
      
      if (lastAtIndex !== -1) {
        // Replace the @something with the selected command
        const newMessage = 
          message.substring(0, lastAtIndex) + 
          command + 
          message.substring(cursorPosition);
        
        setMessage(newMessage);
        
        // Calculate new cursor position after the inserted command
        const newPosition = lastAtIndex + command.length;
        
        // Need to wait for the state to update before setting selection
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
          // Update cursor position on click
          if (textareaRef.current) {
            setCursorPosition(textareaRef.current.selectionStart);
          }
        }}
        onKeyUp={(e) => {
          // Update cursor position on key press
          if (textareaRef.current) {
            setCursorPosition(textareaRef.current.selectionStart);
          }
        }}
        placeholder={getPlaceholder()}
        className="w-full pl-4 pr-20 py-2 rounded-lg bg-transparent text-white resize-none overflow-hidden focus:outline-none"
        rows={1}
        disabled={isSending}
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
