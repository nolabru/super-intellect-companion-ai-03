
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import ChatInput from '@/components/ChatInput';
import { ChatMode } from '@/components/ModeSelector';
import { useAuth } from '@/contexts/AuthContext';
import { useConversation } from '@/hooks/useConversation';
import ModelSelector, { getModelsByMode } from '@/components/ModelSelector';
import { cn } from '@/lib/utils';
import ComparisonView from '@/components/chat/ComparisonView';
import SingleChatView from '@/components/chat/SingleChatView';
import ChatControls from '@/components/chat/ChatControls';

const Index: React.FC = () => {
  const [comparing, setComparing] = useState(false);
  const [isLinked, setIsLinked] = useState(true);
  const [activeMode, setActiveMode] = useState<ChatMode>('text');
  const [leftModel, setLeftModel] = useState('gpt-4o');
  const [rightModel, setRightModel] = useState('claude-3-opus');
  const isMobile = useIsMobile();
  
  const { loading: authLoading } = useAuth();
  const { 
    messages, 
    sendMessage, 
    loading: messagesLoading,
    initialLoadDone,
    currentConversationId,
    setCurrentConversationId
  } = useConversation();
  
  const { conversationId } = useParams<{ conversationId: string }>();
  
  // Define availableModels based on activeMode
  const availableModels = getModelsByMode(activeMode).map(model => model.id);

  useEffect(() => {
    if (conversationId && conversationId !== currentConversationId) {
      console.log(`[Index] ID da conversa na URL: ${conversationId}, atualizando estado`);
      setCurrentConversationId(conversationId);
    }
  }, [conversationId, currentConversationId, setCurrentConversationId]);

  useEffect(() => {
    if (availableModels.length === 0) {
      console.error(`Nenhum modelo disponível para o modo ${activeMode}`);
      return;
    }
    
    if (!availableModels.includes(leftModel)) {
      setLeftModel(availableModels[0]);
      console.log(`Modelo esquerdo atualizado para ${availableModels[0]} devido à mudança para o modo ${activeMode}`);
    }
    
    if (!availableModels.includes(rightModel)) {
      const differentModel = availableModels.find(m => m !== leftModel) || availableModels[0];
      setRightModel(differentModel);
      console.log(`Modelo direito atualizado para ${differentModel} devido à mudança para o modo ${activeMode}`);
    }
  }, [activeMode, leftModel, availableModels]);

  useEffect(() => {
    if (comparing && leftModel === rightModel) {
      const differentModel = availableModels.find(m => m !== leftModel);
      
      if (differentModel) {
        setRightModel(differentModel);
        console.log(`Modelo direito atualizado para ${differentModel} para evitar comparação com o mesmo modelo`);
      }
    }
  }, [comparing, leftModel, rightModel, activeMode, availableModels]);

  useEffect(() => {
    if (isMobile && comparing) {
      setIsLinked(true);
    }
  }, [isMobile, comparing]);

  const handleSendMessage = async (content: string, files?: string[], params?: any, targetModel?: string) => {
    console.log(`Enviando mensagem "${content}" no modo ${activeMode} para o modelo ${targetModel || leftModel}`, params);
    
    let result;
    
    if (comparing) {
      if (isLinked) {
        result = await sendMessage(
          content, 
          activeMode, 
          leftModel, 
          true, 
          leftModel, 
          rightModel,
          files,
          params
        );
      } else {
        if (!targetModel) {
          console.error("Modelo alvo não especificado no modo desvinculado");
          return;
        }
        
        result = await sendMessage(
          content,
          activeMode,
          targetModel,
          true,
          targetModel === leftModel ? leftModel : null,
          targetModel === rightModel ? rightModel : null,
          files,
          params
        );
      }
    } else {
      result = await sendMessage(
        content, 
        activeMode, 
        leftModel, 
        false,
        leftModel, 
        null,
        files,
        params
      );
    }
    
    if (result && result.success && result.modeSwitch) {
      setActiveMode(result.modeSwitch as ChatMode);
      toast.info(`Modo alterado para ${result.modeSwitch} baseado no seu pedido`);
    }
  };

  const toggleComparing = () => {
    setComparing(!comparing);
    if (!comparing) {
      setIsLinked(true);
    }
  };

  const toggleLink = () => {
    if (isMobile) return; // Prevent toggling on mobile
    setIsLinked(!isLinked);
  };

  const handleModeChange = (newMode: ChatMode) => {
    console.log(`Modo alterado de ${activeMode} para ${newMode}`);
    setActiveMode(newMode);
  };

  const handleLeftModelChange = (model: string) => {
    console.log(`Modelo esquerdo alterado para ${model}`);
    setLeftModel(model);
    
    if (comparing && model === rightModel) {
      const differentModel = availableModels.find(m => m !== model);
      if (differentModel) {
        console.log(`Modelo direito atualizado automaticamente para ${differentModel}`);
        setRightModel(differentModel);
      }
    }
  };

  const handleRightModelChange = (model: string) => {
    console.log(`Modelo direito alterado para ${model}`);
    setRightModel(model);
    
    if (model === leftModel) {
      const differentModel = availableModels.find(m => m !== model);
      if (differentModel) {
        console.log(`Modelo esquerdo atualizado automaticamente para ${differentModel}`);
        setLeftModel(differentModel);
      }
    }
  };

  const MobileComparisonHeader = () => {
    if (!comparing || !isMobile) return null;
    
    return (
      <div className="sticky top-0 z-10 px-2 py-2 border-b border-inventu-gray/30 bg-inventu-dark/80 backdrop-blur-lg">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <ModelSelector 
                mode={activeMode}
                selectedModel={leftModel}
                onChange={handleLeftModelChange}
                availableModels={availableModels}
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <ModelSelector 
                mode={activeMode}
                selectedModel={rightModel}
                onChange={handleRightModelChange}
                availableModels={availableModels}
                className="w-full"
              />
            </div>
          </div>
          <div className="text-xs text-white/60 text-center">
            Comparando modelos ({leftModel} vs {rightModel})
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <MobileComparisonHeader />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative min-h-0">
        {comparing ? (
          <ComparisonView
            messages={messages}
            leftModel={leftModel}
            rightModel={rightModel}
            activeMode={activeMode}
            isLinked={isLinked}
            availableModels={availableModels}
            isMobile={isMobile}
            loading={authLoading || messagesLoading}
            initialLoadDone={initialLoadDone}
            handleLeftModelChange={handleLeftModelChange}
            handleRightModelChange={handleRightModelChange}
            handleSendMessage={handleSendMessage}
          />
        ) : (
          <SingleChatView
            messages={messages}
            model={leftModel}
            availableModels={availableModels}
            onModelChange={handleLeftModelChange}
            loading={authLoading || messagesLoading}
            initialLoadDone={initialLoadDone}
          />
        )}
      </div>
      
      <div className="sticky bottom-0 z-30 border-t border-inventu-gray/30 bg-inventu-dark/95 backdrop-blur-lg">
        <ChatControls
          activeMode={activeMode}
          comparing={comparing}
          isLinked={isLinked}
          isMobile={isMobile}
          onModeChange={handleModeChange}
          onToggleCompare={toggleComparing}
          onToggleLink={toggleLink}
        />
        
        {(!comparing || isLinked || isMobile) && (
          <div className="px-2 pb-safe mb-1">
            <ChatInput 
              onSendMessage={handleSendMessage} 
              mode={activeMode}
              model={comparing ? `${leftModel} e ${rightModel}` : leftModel}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
