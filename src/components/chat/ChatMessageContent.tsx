
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
        components={{
          pre: ({ node, ...props }) => (
            <pre className="bg-black/50 p-4 rounded-md my-2 overflow-auto" {...props} />
          ),
          code: ({ node, className, children, ...props }) => {
            // Check if this is inline code using the parent property
            const isInline = !props.className;
            
            if (isInline) {
              return <code className="bg-black/30 px-1 py-0.5 rounded text-amber-300" {...props}>{children}</code>;
            }
            return (
              <code className={`${className || ''}`} {...props}>
                {children}
              </code>
            );
          },
          p: ({ node, children, ...props }) => (
            <p className="mb-4" {...props}>{children}</p>
          ),
          ul: ({ node, children, ...props }) => (
            <ul className="list-disc pl-6 mb-4 space-y-1" {...props}>{children}</ul>
          ),
          ol: ({ node, children, ...props }) => (
            <ol className="list-decimal pl-6 mb-4 space-y-1" {...props}>{children}</ol>
          ),
          li: ({ node, children, ...props }) => (
            <li className="mb-1" {...props}>{children}</li>
          ),
          h1: ({ node, children, ...props }) => (
            <h1 className="text-2xl font-bold mt-6 mb-3" {...props}>{children}</h1>
          ),
          h2: ({ node, children, ...props }) => (
            <h2 className="text-xl font-bold mt-5 mb-2" {...props}>{children}</h2>
          ),
          h3: ({ node, children, ...props }) => (
            <h3 className="text-lg font-bold mt-4 mb-2" {...props}>{children}</h3>
          ),
          blockquote: ({ node, children, ...props }) => (
            <blockquote className="border-l-4 border-gray-500/50 pl-4 italic my-3" {...props}>{children}</blockquote>
          ),
          a: ({ node, children, href, ...props }) => (
            <a href={href} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
          ),
        }}
      >
        {displayedContent}
      </ReactMarkdown>
      {isStreaming && cursorBlink && <span className="animate-pulse text-blue-400">▌</span>}
    </div>
  );
};

export default ChatMessageContent;
