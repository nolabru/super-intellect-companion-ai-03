
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
  // Logs de depuração
  useEffect(() => {
    console.log(`[ChatInterface] Recebeu ${messages.length} mensagens para o modelo ${model}`);
    if (messages.length === 0) {
      console.log('[ChatInterface] Nenhuma mensagem para exibir');
    }
  }, [messages, model]);

  // Ref para o container de mensagens para rolagem automática
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Efeito para rolar para o final quando novas mensagens são adicionadas
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Mostrar todas as mensagens do usuário e todas as mensagens do assistente para o modelo atual
  // Filtrar apenas mensagens de carregamento para o modelo atual
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
    <div className={cn("flex flex-col h-full", className)}>
      <div className={cn(
        "p-2 text-center flex justify-center items-center gap-2",
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
          <div className="font-bold">
            {getModelDisplayName(model)}
            {providerName && <span className="ml-1 text-xs opacity-75">({providerName})</span>}
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <Loader2 className="h-8 w-8 mr-2 animate-spin" />
            <span>Carregando mensagens...</span>
          </div>
        ) : filteredMessages.length > 0 ? (
          <>
            {filteredMessages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            
            {lumaGenId && (
              <div className="p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg my-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-indigo-400 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-indigo-400 font-medium">
                      Processamento de vídeo na Luma AI
                    </p>
                    <p className="text-sm text-gray-300 mt-1">
                      A Luma AI está processando seu vídeo, mas pode demorar mais do que nosso limite de espera. 
                      Você pode verificar o resultado no dashboard da Luma AI com o ID: {lumaGenId}
                    </p>
                    <div className="mt-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1 text-xs text-gray-300"
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
              <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg my-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-400 font-medium">
                      Erro ao processar solicitação
                    </p>
                    <p className="text-sm text-gray-300 mt-1">
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
                          className="flex items-center gap-1 text-xs text-gray-300"
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
            
            {/* Referência para rolar para o final */}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Nenhuma mensagem ainda. Inicie uma conversa!
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
