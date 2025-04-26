import React, { useEffect, useRef } from 'react';
import ChatMessage, { MessageType } from './ChatMessage';
import { cn } from '@/lib/utils';
import { Loader2, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { AVAILABLE_MODELS, getProviderDisplayName } from './ModelSelector';
import { Button } from './ui/button';
import { toast } from 'sonner';
import ModelSelector from './ModelSelector';

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
      console.log(`[ChatInterface:${model}] Filtering message:`, {
        id: msg.id,
        sender: msg.sender,
        model: msg.model,
        isCompareMode
      });
      
      if (isCompareMode) {
        return msg.model === model || 
               (msg.sender === 'user' && msg.model === model);
      } else {
        return msg.sender === 'user' || 
               (msg.sender === 'assistant' && msg.model === model);
      }
    });
  
  const getModelInfo = (modelId: string) => {
    return AVAILABLE_MODELS.find(m => m.id === modelId);
  };

  const getModelDisplayName = (modelId: string) => {
    const modelInfo = getModelInfo(modelId);
    return modelInfo?.displayName || modelId;
  };

  const getModelColor = (modelId: string) => {
    const modelInfo = getModelInfo(modelId);
    if (!modelInfo) return "text-blue-500";
    
    switch (modelInfo.provider) {
      case 'openai':
        return "text-blue-500";
      case 'anthropic':
        return "text-purple-500";
      case 'google':
        return "text-green-500";
      case 'kligin':
        return "text-orange-500";
      case 'ideogram':
        return "text-yellow-500";
      case 'minimax':
        return "text-pink-500";
      case 'elevenlabs':
        return "text-cyan-500";
      case 'luma':
        return "text-indigo-500";
      default:
        return "text-blue-500";
    }
  };
  
  const hasErrorMessage = filteredMessages.some(msg => 
    msg.error && 
    msg.model === model
  );

  const errorMessage = filteredMessages.find(msg => 
    msg.error && 
    msg.model === model
  );

  const isLumaVideo = model === 'luma-video';
  
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
  
  const modelInfo = getModelInfo(model);
  const providerName = modelInfo ? getProviderDisplayName(modelInfo.provider) : "";
  
  return (
    <div className={cn(
      "flex flex-col h-full bg-background shadow-lg overflow-hidden", 
      className
    )}>
      <div className={cn(
        "sticky top-0 z-20 p-3 backdrop-blur-xl bg-black/40 border-b border-white/10 flex justify-center items-center gap-2",
        getModelColor(model)
      )}>
        {onModelChange && availableModels.length > 0 ? (
          <div className="w-full max-w-sm">
            <ModelSelector 
              mode={modelInfo?.modes[0] || 'text'} 
              selectedModel={model} 
              onChange={onModelChange || (() => {})} 
              disabled={!onModelChange}
            />
          </div>
        ) : (
          <div className="font-medium text-white">
            {getModelDisplayName(model)}
            {providerName && <span className="ml-1 text-xs opacity-75">({providerName})</span>}
          </div>
        )}
      </div>
      
      <div className={cn(
        "flex-1 overflow-y-auto overscroll-y-contain touch-pan-y",
        "px-4 py-6 space-y-6 relative pb-safe",
        "scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
      )}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3 animate-fade-in">
            <Loader2 className="h-8 w-8 animate-spin text-white/70" />
            <span className="text-white/70 font-medium">Carregando mensagens...</span>
          </div>
        ) : filteredMessages.length > 0 ? (
          <>
            <div className="space-y-6 min-h-full">
              {filteredMessages.map((message) => (
                <div key={message.id} className="animate-fade-in">
                  <ChatMessage message={message} />
                </div>
              ))}
            </div>
            
            {lumaGenId && (
              <div className="p-4 bg-indigo-900/10 backdrop-blur-sm border border-indigo-500/20 rounded-xl my-4 animate-fade-in shadow-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-indigo-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-indigo-300 font-medium">
                      Processamento de vídeo na Luma AI
                    </p>
                    <p className="text-sm text-gray-300 mt-2">
                      A Luma AI está processando seu vídeo, mas pode demorar mais do que nosso limite de espera. 
                      Você pode verificar o resultado no dashboard da Luma AI com o ID: {lumaGenId}
                    </p>
                    <div className="mt-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1 text-xs text-gray-300 bg-white/5 hover:bg-white/10 border-indigo-500/30"
                        onClick={openLumaDashboard}
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Abrir Dashboard da Luma AI</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {hasErrorMessage && errorMessage && (
              <div className="p-4 bg-red-900/10 backdrop-blur-sm border border-red-500/20 rounded-xl my-4 animate-fade-in shadow-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-300 font-medium">
                      Erro ao processar solicitação
                    </p>
                    <p className="text-sm text-gray-300 mt-2">
                      {errorMessage.content}
                    </p>
                    {(model === 'luma-video' || model === 'luma-image') && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-400 mb-2">
                          Verifique se a chave API da Luma está configurada corretamente nas variáveis de ambiente da Edge Function.
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center gap-1 text-xs text-gray-300 bg-white/5 hover:bg-white/10 border-red-500/30"
                          onClick={showLumaKeyInstructions}
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span>Ver instruções de configuração</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-xl">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-8 w-8 text-white opacity-80" 
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
            <p className="text-gray-400 font-medium">Nenhuma mensagem ainda</p>
            <p className="text-gray-500 text-sm px-8 text-center">Inicie uma conversa enviando uma mensagem abaixo</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
