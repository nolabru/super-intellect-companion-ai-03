
import React from 'react';
import ChatMessage, { MessageType } from './ChatMessage';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { AVAILABLE_MODELS } from './ModelSelector';
import { Button } from './ui/button';
import { toast } from 'sonner';

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
  const filteredMessages = messages.filter(msg => 
    msg.sender === 'user' || 
    msg.model === model || 
    (msg.id && msg.id.startsWith('loading-') && msg.model === model)
  );
  
  const getModelDisplayName = (modelId: string) => {
    const modelInfo = AVAILABLE_MODELS.find(m => m.id === modelId);
    return modelInfo?.displayName || modelId;
  };

  const getModelColor = (modelId: string) => {
    const modelInfo = AVAILABLE_MODELS.find(m => m.id === modelId);
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
  
  const hasVideoLoadingMessage = filteredMessages.some(msg => 
    msg.id?.startsWith('loading-') && 
    msg.mode === 'video' && 
    msg.model === model
  );
  
  const videoLoadingMessage = filteredMessages.find(msg => 
    msg.id?.startsWith('loading-') && 
    msg.mode === 'video' && 
    msg.model === model
  );

  const hasErrorMessage = filteredMessages.some(msg => 
    msg.error && 
    msg.model === model
  );

  const errorMessage = filteredMessages.find(msg => 
    msg.error && 
    msg.model === model
  );

  const isKliginVideo = model === 'kligin-video';
  const isLumaVideo = model === 'luma-video';
  const isLumaImage = model === 'luma-image';
  
  // Verificar se alguma mensagem contém ID de geração da Luma
  const lumaGenIdMessage = filteredMessages.find(msg => 
    msg.model?.includes('luma') && 
    msg.content.includes('ID:') && 
    !msg.error
  );
  
  // Extrair ID da mensagem se existir
  const extractLumaId = (content: string): string | null => {
    const match = content.match(/ID: ([a-f0-9-]+)/i);
    return match ? match[1] : null;
  };
  
  const lumaGenId = lumaGenIdMessage ? extractLumaId(lumaGenIdMessage.content) : null;
  
  // Função para abrir o painel da Luma em uma nova aba
  const openLumaDashboard = () => {
    window.open('https://lumalabs.ai/dashboard', '_blank');
    toast.success('Abrindo painel da Luma AI');
  };
  
  // Função para mostrar instruções de como configurar a chave da Luma
  const showLumaKeyInstructions = () => {
    toast.info(
      <div className="space-y-2">
        <p className="font-medium">Como configurar a API key da Luma AI</p>
        <ol className="list-decimal pl-4 text-sm space-y-1">
          <li>Acesse o Edge Function Manager na interface do Supabase</li>
          <li>Selecione a função "ai-chat"</li>
          <li>Vá em "Settings" e depois "Environment Variables"</li>
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
    <div className={cn("flex flex-col h-full", className)}>
      <div className={cn(
        "p-2 text-center flex justify-center items-center",
        getModelColor(model)
      )}>
        <Select value={model} onValueChange={onModelChange || (() => {})}>
          <SelectTrigger className="w-48 bg-inventu-card text-white border-inventu-gray/30 font-bold">
            <SelectValue placeholder={getModelDisplayName(model)} />
          </SelectTrigger>
          <SelectContent>
            {availableModels.map(modelOption => {
              const displayName = getModelDisplayName(modelOption);
              return (
                <SelectItem key={modelOption} value={modelOption}>
                  {displayName}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
        {loading && filteredMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <Loader2 className="h-8 w-8 mr-2 animate-spin" />
            <span>Carregando mensagens...</span>
          </div>
        ) : filteredMessages.length > 0 ? (
          <>
            {filteredMessages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            
            {hasVideoLoadingMessage && (
              <div className="text-center p-3 bg-inventu-darker/20 rounded-lg my-4 text-gray-300">
                <p className="text-sm font-medium">
                  {isKliginVideo ? 
                    "A geração de vídeo pode levar até 3 minutos para ser concluída." :
                    isLumaVideo ?
                    "A Luma AI está processando sua solicitação de vídeo. Isso pode levar alguns minutos." :
                    "Processando sua solicitação de vídeo..."
                  }
                </p>
                <p className="text-xs mt-1 text-gray-400">
                  {isKliginVideo ?
                    "O sistema está conectando ao serviço do Kligin AI. Por favor, aguarde." :
                    isLumaVideo ?
                    "O processo pode levar entre 30 segundos e 2 minutos dependendo da complexidade. Estamos usando a SDK oficial da Luma." :
                    "Estamos trabalhando na sua solicitação. Isso pode levar alguns instantes."
                  }
                </p>
                
                {videoLoadingMessage?.content && (
                  <div className="mt-3 flex justify-center">
                    <div className="bg-inventu-blue/20 px-3 py-1 rounded-full text-xs flex items-center">
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      <span>
                        {videoLoadingMessage.content.includes("processamento") ? 
                          "Processando vídeo..." : 
                          "Conectando ao serviço de vídeo..."
                        }
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="mt-3 h-1 w-full bg-gray-700 rounded overflow-hidden">
                  <div 
                    className="h-full bg-inventu-blue opacity-80"
                    style={{
                      width: '30%',
                      animation: 'progressAnimation 2s ease-in-out infinite'
                    }}
                  ></div>
                </div>
                <style>
                  {`
                    @keyframes progressAnimation {
                      0% {
                        margin-left: -30%;
                      }
                      100% {
                        margin-left: 100%;
                      }
                    }
                  `}
                </style>
              </div>
            )}
            
            {lumaGenId && (
              <div className="p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg my-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-indigo-400 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-indigo-400 font-medium">
                      Vídeo em processamento na Luma AI
                    </p>
                    <p className="text-sm text-gray-300 mt-1">
                      O sistema Luma AI está processando seu vídeo, mas pode demorar mais tempo que o nosso limite de espera. 
                      Você pode verificar o resultado no painel da Luma AI com o ID: {lumaGenId}
                    </p>
                    <div className="mt-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1 text-xs text-gray-300"
                        onClick={openLumaDashboard}
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Abrir painel da Luma AI</span>
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
                      Erro ao processar a solicitação
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
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Nenhuma mensagem ainda. Comece uma conversa!
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
