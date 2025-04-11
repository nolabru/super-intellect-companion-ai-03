import React, { useEffect, useRef, useState } from 'react';
import ChatMessage, { MessageType } from './ChatMessage';
import { cn } from '@/lib/utils';
import { Loader2, AlertTriangle, RefreshCw, ExternalLink, MessageSquare, ArrowDown } from 'lucide-react';
import { AVAILABLE_MODELS, getProviderDisplayName } from './ModelSelector';
import { Button } from './ui/button';
import { toast } from 'sonner';
import ModelSelector from './ModelSelector';
import AnimatedTypingIndicator from './chat/AnimatedTypingIndicator';

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
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  
  useEffect(() => {
    console.log(`[ChatInterface] Recebeu ${messages.length} mensagens para o modelo ${model}`);
    if (messages.length === 0) {
      console.log('[ChatInterface] Nenhuma mensagem para exibir');
    }
  }, [messages, model]);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      scrollToBottom();
    }
  }, [messages, autoScroll]);

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setAutoScroll(isAtBottom);
      setShowScrollToBottom(!isAtBottom);
    };

    chatContainer.addEventListener('scroll', handleScroll);
    return () => chatContainer.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredMessages = messages.filter(msg => 
    msg.sender === 'user' || 
    (msg.sender === 'assistant' && !msg.id?.startsWith('loading-') && (!msg.model || msg.model === model || isCompareMode)) || 
    (msg.id?.startsWith('loading-') && msg.model === model)
  );
  
  const getModelInfo = (modelId: string) => {
    return AVAILABLE_MODELS.find(m => m.id === modelId);
  };

  const getModelDisplayName = (modelId: string) => {
    const modelInfo = getModelInfo(modelId);
    return modelInfo?.displayName || modelId;
  };

  const getModelColor = (modelId: string) => {
    const modelInfo = getModelInfo(modelId);
    if (!modelInfo) return "text-inventu-blue";
    
    switch (modelInfo.provider) {
      case 'openai':
        return "text-inventu-blue";
      case 'anthropic':
        return "text-inventu-purple";
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
        return "text-inventu-blue";
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
    <div className={cn("flex flex-col h-full bg-inventu-darker shadow-md rounded-xl overflow-hidden", className)}>
      <div className={cn(
        "p-3 backdrop-blur-sm bg-black/20 border-b border-white/5 flex justify-center items-center gap-2 transition-colors",
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
          <div className="font-medium text-white flex items-center">
            <span className="mr-1">{getModelDisplayName(model)}</span>
            {providerName && <span className="ml-1 text-xs opacity-75 bg-white/10 px-2 py-0.5 rounded-full">({providerName})</span>}
          </div>
        )}
      </div>
      
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-5 space-y-5 relative scroll-smooth"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3 animate-fade-in">
            <Loader2 className="h-8 w-8 animate-spin text-white/70" />
            <span className="text-white/70 font-medium">Carregando mensagens...</span>
          </div>
        ) : filteredMessages.length > 0 ? (
          <>
            <div className="space-y-5">
              {filteredMessages.map((message) => (
                <div key={message.id} className="animate-fade-in">
                  <ChatMessage message={message} />
                </div>
              ))}
            </div>
            
            {lumaGenId && (
              <div className="p-4 bg-indigo-900/10 backdrop-blur-sm border border-indigo-500/20 rounded-xl my-4 animate-fade-in shadow-lg hover:bg-indigo-900/20 transition-colors">
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
                        className="flex items-center gap-1 text-xs text-gray-300 bg-white/5 hover:bg-white/10 border-indigo-500/30 transition-colors"
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
              <div className="p-4 bg-red-900/10 backdrop-blur-sm border border-red-500/20 rounded-xl my-4 animate-fade-in shadow-lg hover:bg-red-900/20 transition-colors">
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
                          className="flex items-center gap-1 text-xs text-gray-300 bg-white/5 hover:bg-white/10 border-red-500/30 transition-colors"
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
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-xl">
              <MessageSquare className="h-8 w-8 text-white opacity-80" />
            </div>
            <p className="text-gray-400 font-medium">Nenhuma mensagem ainda</p>
            <p className="text-gray-500 text-sm px-8 text-center">Inicie uma conversa enviando uma mensagem abaixo</p>
          </div>
        )}

        {showScrollToBottom && (
          <button
            className="absolute bottom-5 right-5 bg-inventu-blue/80 hover:bg-inventu-blue text-white rounded-full p-2 shadow-lg animate-fade-in transition-all hover:scale-110"
            onClick={scrollToBottom}
          >
            <ArrowDown className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
