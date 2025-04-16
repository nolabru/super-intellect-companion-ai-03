
import React, { useState, useEffect } from 'react';
import { AlertTriangle, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessageContentProps {
  content: string;
  isLoading: boolean;
  isError: boolean;
  isStreaming?: boolean;
}

const ChatMessageContent: React.FC<ChatMessageContentProps> = ({ 
  content, 
  isLoading, 
  isError,
  isStreaming
}) => {
  const [displayedContent, setDisplayedContent] = useState<string>('');
  const [cursorBlink, setCursorBlink] = useState<boolean>(true);

  // Efeito para animar o cursor piscando
  useEffect(() => {
    if (isStreaming) {
      const interval = setInterval(() => {
        setCursorBlink(prev => !prev);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isStreaming]);

  // Efeito para atualizar o conteúdo sendo renderizado
  useEffect(() => {
    setDisplayedContent(content || '');
  }, [content]);

  if (isLoading) {
    return (
      <div className="flex items-center">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        <span className="text-white/90">{content || 'Gerando resposta...'}</span>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="flex flex-col">
        <div className="text-red-400 font-medium mb-1 flex items-center">
          <AlertTriangle size={16} className="mr-1" /> Erro
        </div>
        <div>{content || 'Ocorreu um erro ao processar sua solicitação.'}</div>
        <div className="mt-2 text-sm text-red-400/80">
          Por favor, tente novamente ou escolha um parâmetro diferente.
        </div>
      </div>
    );
  }
  
  // Verifica se temos conteúdo para exibir
  if (!displayedContent) {
    return <div className="text-gray-400">Aguardando resposta...</div>;
  }
  
  // Use ReactMarkdown para renderizar o conteúdo formatado
  return (
    <div className="markdown-content text-white">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
      >
        {displayedContent}
      </ReactMarkdown>
      {isStreaming && cursorBlink && <span className="animate-pulse text-blue-400">▌</span>}
    </div>
  );
};

export default ChatMessageContent;
