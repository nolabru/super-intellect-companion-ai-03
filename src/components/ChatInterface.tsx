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
    (!msg.id?.startsWith('loading-') || msg.model === model)
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
    toast.success('Opening Luma AI Dashboard');
  };
  
  const showLumaKeyInstructions = () => {
    toast.info(
      <div className="space-y-2">
        <p className="font-medium">How to configure the Luma AI API key</p>
        <ol className="list-decimal pl-4 text-sm space-y-1">
          <li>Access the Edge Function Manager in the Supabase interface</li>
          <li>Select the "ai-chat" function</li>
          <li>Go to "Settings" and then "Environment Variables"</li>
          <li>Add the LUMA_API_KEY variable with your key</li>
          <li>The key should start with "luma_" and can be obtained from the Luma AI website</li>
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
            <span>Loading messages...</span>
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
                      Video processing in Luma AI
                    </p>
                    <p className="text-sm text-gray-300 mt-1">
                      Luma AI is processing your video, but it may take longer than our wait limit. 
                      You can check the result in the Luma AI dashboard with the ID: {lumaGenId}
                    </p>
                    <div className="mt-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1 text-xs text-gray-300"
                        onClick={openLumaDashboard}
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Open Luma AI Dashboard</span>
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
                      Error processing request
                    </p>
                    <p className="text-sm text-gray-300 mt-1">
                      {errorMessage.content}
                    </p>
                    {(model === 'luma-video' || model === 'luma-image') && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-400 mb-2">
                          Verify that the Luma API key is correctly configured in the Edge Function environment variables.
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center gap-1 text-xs text-gray-300"
                          onClick={showLumaKeyInstructions}
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span>View setup instructions</span>
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
            No messages yet. Start a conversation!
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
