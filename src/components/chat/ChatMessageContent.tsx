
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
    setDisplayedContent(content);
  }, [content]);

  if (isLoading) {
    return (
      <div className="flex items-center">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        <span className="text-white/90">{content}</span>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="flex flex-col">
        <div className="text-red-400 font-medium mb-1 flex items-center">
          <AlertTriangle size={16} className="mr-1" /> Erro
        </div>
        <div>{content}</div>
        <div className="mt-2 text-sm text-red-400/80">
          Por favor, tente novamente ou escolha um parâmetro diferente.
        </div>
      </div>
    );
  }
  
  // Process content to handle asterisks for bold text if not already in markdown format
  const processedContent = displayedContent
    .replace(/\*\*([^*]+)\*\*/g, '**$1**')  // Keep existing markdown
    .replace(/(\d+)\.\s/g, '$1. ');         // Preserve numbered lists
  
  // Use ReactMarkdown to render formatted content
  return (
    <div className="markdown-content text-white">
      <ReactMarkdown
        components={{
          // Custom component for paragraphs to preserve line breaks
          p: ({ children }) => <p className="mb-2">{children}</p>,
          // Custom components for strong/bold text
          strong: ({ children }) => <span className="font-bold text-white">{children}</span>,
          // Custom component for headings
          h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-1">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-1">{children}</h2>,
          h3: ({ children }) => <h3 className="text-md font-bold mb-2 mt-1">{children}</h3>,
          // Custom component for list items
          li: ({ children }) => <li className="ml-4 mb-1">• {children}</li>,
          // Custom component for links
          a: ({ href, children }) => (
            <a 
              href={href}
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-400 underline hover:text-blue-300"
            >
              {children}
            </a>
          )
        }}
        // Enable breaking lines on line breaks
        remarkPlugins={[remarkGfm]}
      >
        {processedContent}
      </ReactMarkdown>
      {isStreaming && cursorBlink && <span className="animate-pulse text-blue-400">▌</span>}
    </div>
  );
};

export default ChatMessageContent;
