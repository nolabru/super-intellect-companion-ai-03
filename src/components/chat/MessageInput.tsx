import React, { useRef, useEffect, useState, useMemo, memo } from 'react';
import { Send, Paperclip, Calendar, FileSpreadsheet, FileText, Mail, FolderOpen, AlertTriangle } from 'lucide-react';
import { ChatMode } from '@/components/ModeSelector';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTouchDevice } from '@/hooks/useTouchDevice';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
interface MessageInputProps {
  message: string;
  setMessage: (message: string) => void;
  onSendMessage: () => void;
  onAttachment: () => void;
  isImageGenerationModel: boolean;
  isSending: boolean;
  mode: ChatMode;
  model: string;
  hasActiveConversation?: boolean;
  onCreateConversation?: () => void;
}
const GOOGLE_COMMANDS = [{
  id: 'calendar',
  name: 'Calendário',
  icon: <Calendar className="h-4 w-4 mr-2" />,
  description: 'Criar eventos no Google Calendar',
  command: '@calendar '
}, {
  id: 'sheet',
  name: 'Planilhas',
  icon: <FileSpreadsheet className="h-4 w-4 mr-2" />,
  description: 'Ler e escrever dados no Google Sheets',
  command: '@sheet '
}, {
  id: 'doc',
  name: 'Documentos',
  icon: <FileText className="h-4 w-4 mr-2" />,
  description: 'Criar ou atualizar documentos Google Docs',
  command: '@doc '
}, {
  id: 'drive',
  name: 'Drive',
  icon: <FolderOpen className="h-4 w-4 mr-2" />,
  description: 'Carregar arquivos no Google Drive',
  command: '@drive '
}, {
  id: 'email',
  name: 'Email',
  icon: <Mail className="h-4 w-4 mr-2" />,
  description: 'Gerar e enviar e-mails via Gmail',
  command: '@email '
}];
const MessageInput: React.FC<MessageInputProps> = ({
  message,
  setMessage,
  onSendMessage,
  onAttachment,
  isImageGenerationModel,
  isSending,
  mode,
  model,
  hasActiveConversation = true,
  onCreateConversation
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandMenuPosition, setCommandMenuPosition] = useState({
    top: 0,
    left: 0
  });
  const {
    isGoogleConnected
  } = useGoogleAuth();
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const isTouchDevice = useTouchDevice();
  const isMobile = useIsMobile();
  const [hasApiError, setHasApiError] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const placeholder = useMemo(() => {
    if (!hasActiveConversation) {
      return "Crie uma conversa para começar...";
    }
    if (isImageGenerationModel) {
      return "Descreva sua imagem...";
    }
    if (mode === 'video') {
      return "Descreva seu vídeo...";
    }
    if (mode === 'audio') {
      return "Digite seu texto...";
    }
    if (model) {
      return "Pergunte...";
    }
    return "Digite aqui...";
  }, [isImageGenerationModel, mode, model, hasActiveConversation]);
  useEffect(() => {
    setHasApiError(false);
  }, [mode, model]);
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
          const yOffset = isMobile ? -215 : -10;
          setCommandMenuPosition({
            top: yOffset,
            left: 10
          });
          return;
        }
      }
    }
    setShowCommandMenu(false);
  }, [message, cursorPosition, isMobile]);
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!hasActiveConversation) {
      if (!user) {
        toast.info("Faça login para continuar", {
          description: "É necessário estar logado para criar uma conversa.",
          action: {
            label: "Fazer login",
            onClick: () => navigate('/auth', { state: { from: location.pathname } })
          },
          duration: 4000
        });
        return;
      }
      toast.info("Crie uma conversa primeiro", {
        description: "É necessário criar uma conversa antes de começar a digitar.",
        action: onCreateConversation ? {
          label: "Criar agora",
          onClick: onCreateConversation
        } : undefined,
        duration: 4000
      });
      return;
    }
    setMessage(e.target.value);
    setCursorPosition(e.target.selectionStart);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(120, Math.max(44, e.target.scrollHeight));
      textareaRef.current.style.height = `${newHeight}px`;
    }
    if (hasApiError) {
      setHasApiError(false);
    }
  };
  const insertCommand = (command: string) => {
    if (!hasActiveConversation) {
      if (!user) {
        toast.info("Faça login para continuar", {
          description: "É necessário estar logado para criar uma conversa.",
          action: {
            label: "Fazer login",
            onClick: () => navigate('/auth', { state: { from: location.pathname } })
          }
        });
        return;
      }
      toast.info("Crie uma conversa primeiro", {
        description: "É necessário criar uma conversa antes de usar comandos.",
        action: onCreateConversation ? {
          label: "Criar agora",
          onClick: onCreateConversation
        } : undefined
      });
      return;
    }
    if (!isGoogleConnected) {
      toast.error("Conta Google não conectada", {
        description: "Para usar comandos do Google, você precisa fazer login com sua conta Google."
      });
      setShowCommandMenu(false);
      return;
    }
    if (textareaRef.current) {
      const beforeCursor = message.substring(0, cursorPosition);
      const lastAtIndex = beforeCursor.lastIndexOf('@');
      if (lastAtIndex !== -1) {
        const newMessage = message.substring(0, lastAtIndex) + command + message.substring(cursorPosition);
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
  const handleSendWithError = () => {
    if (!hasActiveConversation) {
      if (!user) {
        toast.info("Faça login para continuar", {
          description: "É necessário estar logado para criar uma conversa.",
          action: {
            label: "Fazer login",
            onClick: () => navigate('/auth', { state: { from: location.pathname } })
          }
        });
        return;
      }
      toast.info("Crie uma conversa primeiro", {
        description: "É necessário criar uma conversa antes de enviar mensagens.",
        action: onCreateConversation ? {
          label: "Criar agora",
          onClick: onCreateConversation
        } : undefined
      });
      return;
    }
    if ((mode === 'image' || mode === 'video' || mode === 'audio') && hasApiError) {
      toast.error(`Falha na conexão com o serviço de ${mode === 'image' ? 'imagens' : mode === 'video' ? 'vídeos' : 'áudio'}`, {
        description: "Tente novamente em alguns instantes ou verifique sua conexão.",
        action: {
          label: "Tentar novamente",
          onClick: () => {
            setHasApiError(false);
            onSendMessage();
          }
        },
        duration: 5000
      });
      return;
    }
    onSendMessage();
  };
  const showApiErrorBanner = hasApiError && (mode === 'image' || mode === 'video' || mode === 'audio');
  const buttonClasses = cn("transition-all rounded-xl", "text-white/60 hover:text-white active:scale-95", isTouchDevice ? "p-3 hover:bg-white/10" : "p-2.5 hover:bg-white/5", isSending && "opacity-50 cursor-not-allowed");
  const commandMenu = useMemo(() => {
    if (!showCommandMenu) return null;
    return <div className={cn("absolute left-0 z-50 w-[300px] bg-inventu-dark border border-inventu-gray/30 rounded-md overflow-hidden shadow-lg", isMobile ? "bottom-[65px]" : "-top-[235px]")} style={{
      transform: `translate(${commandMenuPosition.left}px, 0px)`
    }}>
        <div className="p-2 bg-inventu-darker border-b border-inventu-gray/30">
          <p className="text-xs text-inventu-gray">Google Workspace</p>
        </div>
        <div className="max-h-[200px] overflow-y-auto">
          {GOOGLE_COMMANDS.map(cmd => <div key={cmd.id} className="flex items-center p-2 hover:bg-inventu-gray/20 active:bg-inventu-gray/30 cursor-pointer text-white" onClick={() => insertCommand(cmd.command)}>
              {cmd.icon}
              <div>
                <p className="text-sm font-medium">{cmd.name}</p>
                <p className="text-xs text-inventu-gray">{cmd.description}</p>
              </div>
            </div>)}
        </div>
      </div>;
  }, [showCommandMenu, commandMenuPosition, message, cursorPosition, isGoogleConnected, isMobile, hasActiveConversation, onCreateConversation, navigate, user]);

  // Show alert banner when there's no active conversation
  const showNoConversationBanner = !hasActiveConversation;
  return <div>
      {showApiErrorBanner && <div className="px-3 py-2 bg-red-500/20 border-t border-red-500/30 mb-1 rounded-t-lg flex items-center">
          <AlertTriangle className="h-4 w-4 text-red-400 mr-2 flex-shrink-0" />
          <span className="text-xs text-red-200">
            Problema de conexão com serviço de {mode === 'image' ? 'imagens' : mode === 'video' ? 'vídeos' : 'áudio'}.
            Tente novamente ou mude o modelo.
          </span>
        </div>}
      
      {showNoConversationBanner && <div className="px-3 py-2 border-t border-blue-500/30 mb-1 rounded-t-lg flex items-center bg-inventu-darker">
          <AlertTriangle className="h-4 w-4 text-blue-300 mr-2 flex-shrink-0" />
          <span className="text-blue-100 text-xs font-medium">
            {!user ? "Faça login para criar uma conversa." : "Crie uma conversa para começar a interagir."}
          </span>
          {!user ? (
            <button 
              onClick={() => navigate('/auth', { state: { from: location.pathname } })}
              className="ml-auto text-xs text-white rounded px-[16px] bg-inventu-card py-[10px] transition-all duration-200 hover:bg-inventu-blue"
            >
              Fazer Login
            </button>
          ) : onCreateConversation && (
            <button 
              onClick={onCreateConversation} 
              className="ml-auto text-xs text-white rounded px-[16px] bg-inventu-card py-[10px] transition-all duration-200 hover:bg-inventu-blue"
            >
              Criar Conversa
            </button>
          )}
        </div>}
      
      <div className={cn("relative flex items-center gap-2 p-1.5", isFocused && "ring-1 ring-white/30", (showApiErrorBanner || showNoConversationBanner) && "rounded-t-none", !hasActiveConversation && "bg-black/40 opacity-80")} ref={containerRef}>
        <textarea ref={textareaRef} value={message} onChange={handleMessageChange} onKeyDown={e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSendWithError();
        }
      }} onClick={e => {
        if (!hasActiveConversation) {
          e.preventDefault();
          toast.info("Crie uma conversa primeiro", {
            description: "É necessário criar uma conversa antes de começar a digitar.",
            action: onCreateConversation ? {
              label: "Criar agora",
              onClick: onCreateConversation
            } : undefined
          });
          return;
        }
        if (textareaRef.current) {
          setCursorPosition(textareaRef.current.selectionStart);
        }
      }} onKeyUp={() => {
        if (textareaRef.current) {
          setCursorPosition(textareaRef.current.selectionStart);
        }
      }} onFocus={() => {
        setIsFocused(true);
        if (!hasActiveConversation) {
          toast.info("Crie uma conversa primeiro", {
            description: "É necessário criar uma conversa antes de começar a digitar.",
            action: onCreateConversation ? {
              label: "Criar agora",
              onClick: onCreateConversation
            } : undefined
          });
        }
      }} onBlur={() => setIsFocused(false)} placeholder={placeholder} className={cn("w-full pl-3 pr-24 py-2 bg-transparent text-white resize-none overflow-hidden focus:outline-none", "min-h-[36px] text-base leading-relaxed placeholder:text-white/40", isMobile && "text-lg py-3", !hasActiveConversation && "cursor-not-allowed")} rows={1} disabled={isSending || !hasActiveConversation} style={{
        maxHeight: '100px'
      }} />
        
        <div className={cn("absolute top-1/2 right-2 -translate-y-1/2 flex gap-1.5", isMobile && "gap-3")}>
          <button onClick={() => {
          if (!hasActiveConversation) {
            toast.info("Crie uma conversa primeiro", {
              description: "É necessário criar uma conversa antes de anexar arquivos.",
              action: onCreateConversation ? {
                label: "Criar agora",
                onClick: onCreateConversation
              } : undefined
            });
            return;
          }
          onAttachment();
        }} className={cn(buttonClasses, !hasActiveConversation && "opacity-50 cursor-not-allowed")} title={mode === 'text' ? 'Anexar arquivo' : `Anexar ${mode}`} disabled={isSending || !hasActiveConversation} aria-label={mode === 'text' ? 'Anexar arquivo' : `Anexar ${mode}`}>
            <Paperclip className={cn("h-5 w-5", isTouchDevice && "h-6 w-6")} />
          </button>
          
          <button onClick={handleSendWithError} className={cn(buttonClasses, !hasActiveConversation && "opacity-50 cursor-not-allowed")} disabled={isSending || !hasActiveConversation} aria-label="Enviar mensagem">
            <Send className={cn("h-5 w-5", isTouchDevice && "h-6 w-6")} />
          </button>
        </div>
        
        {commandMenu}
      </div>
    </div>;
};
export default memo(MessageInput);
