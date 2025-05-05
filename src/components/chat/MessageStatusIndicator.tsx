
import React from 'react';
import { Loader2 } from 'lucide-react';

interface MessageStatusIndicatorProps {
  isLoading?: boolean;
  isError?: boolean;
  isVideo?: boolean;
  model?: string;
}

const MessageStatusIndicator: React.FC<MessageStatusIndicatorProps> = ({
  isLoading,
  isError,
  isVideo,
  model
}) => {
  if (isLoading && !isVideo) {
    return (
      <div className="flex items-center mt-2">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-xs text-inventu-gray">
          {model ? `${model} está processando...` : 'Processando...'}
        </span>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="text-red-400 text-xs mt-2">
        Ocorreu um erro ao processar esta mensagem.
      </div>
    );
  }
  
  return null;
};

export default MessageStatusIndicator;
