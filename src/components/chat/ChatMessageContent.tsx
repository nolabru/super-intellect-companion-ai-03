
import React from 'react';
import { AlertTriangle, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ChatMessageContentProps {
  content: string;
  isLoading: boolean;
  isError: boolean;
}

const ChatMessageContent: React.FC<ChatMessageContentProps> = ({ 
  content, 
  isLoading, 
  isError 
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        {content}
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
  
  return <>{content}</>;
};

export default ChatMessageContent;
