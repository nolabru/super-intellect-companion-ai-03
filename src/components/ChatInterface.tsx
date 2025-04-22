import React, { useEffect, useRef } from 'react';
import ChatMessage, { MessageType } from './ChatMessage';
import { cn } from '@/lib/utils';
import { Loader2, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { AVAILABLE_MODELS, getProviderDisplayName } from './ModelSelector';
import { Button } from './ui/button';
import { toast } from 'sonner';
import ModelSelector from './ModelSelector';
import ChatModelSelectorBar from './ChatModelSelectorBar';

function ChatMinimalHeader({ model, onModelChange, availableModels }) {
  const modelInfo = AVAILABLE_MODELS.find(m => m.id === model);
  return (
    <div className={cn(
      "flex items-center justify-between px-4 py-1.5 bg-black/60 backdrop-blur-lg border-b border-white/10",
      "min-h-[46px]"
    )}>
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
        <span className="font-semibold text-white text-base truncate max-w-[130px]">
          {modelInfo?.displayName || model}
        </span>
      </div>
      {onModelChange && !!availableModels?.length && (
        <div>
          <ModelSelector 
            mode={modelInfo?.modes?.[0] || 'text'}
            selectedModel={model}
            onChange={onModelChange}
            disabled={!onModelChange}
            compact={true}
          />
        </div>
      )}
    </div>
  );
}

interface ChatInterfaceProps {
  messages: MessageType[];
  model: string;
  className?: string;
  title: string;
  onModelChange?: (model: string) => void;
  availableModels?: string[];
  isCompareMode?: boolean;
  loading?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  model, 
  className, 
  title,
  onModelChange,
  availableModels = [],
  isCompareMode = false,
  loading = false
}) => {
  useEffect(() => {
    console.log(`[ChatInterface] Recebeu ${messages.length} mensagens para o modelo ${model}`);
    if (messages.length === 0) {
      console.log('[ChatInterface] Nenhuma mensagem para exibir');
    }
  }, [messages, model]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const filteredMessages = messages
    .filter((msg, index, array) => {
      if (index === 0) return true;
      const prevMsg = array[index - 1];
      const isDuplicate = prevMsg.sender === msg.sender && 
                        prevMsg.content === msg.content && 
                        prevMsg.model === msg.model &&
                        (new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() < 500);
      return !isDuplicate;
    })
    .filter(msg => {
      if (isCompareMode) {
        return msg.model === model || (msg.sender === 'user' && msg.model === model);
      } else {
        return msg.sender === 'user' || (msg.sender === 'assistant' && msg.model === model);
      }
    });

  const hasErrorMessage = filteredMessages.some(msg => 
    msg.error && 
    msg.model === model
  );
  const errorMessage = filteredMessages.find(msg => 
    msg.error && 
    msg.model === model
  );
  const lumaGenIdMessage = filteredMessages.find(msg => 
    msg.model?.includes('luma') &&
    msg.content.includes('ID:') &&
    !msg.error
  );
  const extractLumaId = (content: string): string | null => {
    const match = content.match(/ID: ([a-f0-9-]+)/i);
    return match ? match[1] : null;
  };
  const lumaGenId = lumaGenIdMessage ? extractLumaId(lumaGenIdMessage.content) : null;
  const openLumaDashboard = () => {
    window.open('https://lumalabs.ai/dashboard', '_blank');
    toast.success('Abrindo Dashboard da Luma AI');
  };
  const showLumaKeyInstructions = () => {
    toast.info(
      <div className="space-y-2">
        <p className="font-medium">Como configurar a chave de API da Luma AI</p>
        <ol className="list-decimal pl-4 text-sm space-y-1">
          <li>Acesse o Gerenciador de Funções Edge na interface do Supabase</li>
          <li>Selecione a função "ai-chat"</li>
          <li>Vá para "Configurações" e depois "Variáveis de Ambiente"</li>
          <li>Adicione a variável LUMA_API_KEY com sua chave</li>
          <li>A chave deve começar com "luma_" e pode ser obtida no site da Luma AI</li>
        </ol>
      </div>,
      {
        duration: 8000,
        icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      }
    );
  };

  return (
    <div className={cn("flex flex-col h-full bg-background overflow-hidden", className)}>
      <ChatMinimalHeader 
        model={model} 
        onModelChange={undefined}
        availableModels={undefined}
      />
      <ChatModelSelectorBar
        selectedModel={model}
        onModelChange={onModelChange}
        availableModels={availableModels}
      />
      <div className={cn(
        "flex-1 overflow-y-auto px-2 py-2 space-y-2 relative",
        "bg-background scroll-smooth"
      )}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 animate-fade-in">
            <Loader2 className="h-5 w-5 animate-spin text-white/70" />
          </div>
        ) : filteredMessages.length > 0 ? (
          <>
            <div className="space-y-2">
              {filteredMessages.map((message) => (
                <div key={message.id} className="animate-fade-in">
                  <ChatMessage message={message} />
                </div>
              ))}
            </div>
            {lumaGenId && (
              <div className="p-3 flex items-center gap-2 bg-indigo-900/20 border border-indigo-700/40 rounded-lg my-2">
                <AlertTriangle className="h-4 w-4 text-indigo-400" />
                <span className="text-xs text-indigo-200">
                  Processando vídeo na Luma AI — resultado com ID <span className="font-semibold">{lumaGenId}</span>. 
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-2 py-0.5 px-2 text-xs"
                    onClick={openLumaDashboard}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Dashboard
                  </Button>
                </span>
              </div>
            )}
            {hasErrorMessage && errorMessage && (
              <div className="p-3 flex items-center gap-2 bg-red-900/20 border border-red-500/30 rounded-lg my-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-red-200">{errorMessage.content}</span>
                  {(model === 'luma-video' || model === 'luma-image') && (
                    <Button
                      variant="outline" 
                      size="sm" 
                      className="ml-2 py-0.5 px-2 text-xs"
                      onClick={showLumaKeyInstructions}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Instruções Luma
                    </Button>
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-white opacity-80"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <p className="text-gray-400 text-xs pt-2">Inicie uma conversa</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
