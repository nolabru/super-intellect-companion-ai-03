import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import AppHeader from '@/components/AppHeader';
import ChatInterface from '@/components/ChatInterface';
import ChatInput from '@/components/ChatInput';
import ConversationSidebar from '@/components/ConversationSidebar';
import { ChatMode } from '@/components/ModeSelector';
import { useAuth } from '@/contexts/AuthContext';
import { useConversation } from '@/hooks/useConversation';
import ModeSelector from '@/components/ModeSelector';
import CompareModelsButton from '@/components/CompareModelsButton';
import LinkToggleButton from '@/components/LinkToggleButton';
import ModelSelector, { getModelsByMode } from '@/components/ModelSelector';
import TokenDisplay from '@/components/TokenDisplay';
import { useIsMobile } from '@/hooks/use-mobile';

const Index: React.FC = () => {
  const [comparing, setComparing] = useState(false);
  const [isLinked, setIsLinked] = useState(true);
  const [activeMode, setActiveMode] = useState<ChatMode>('text');
  const [leftModel, setLeftModel] = useState('gpt-4o');
  const [rightModel, setRightModel] = useState('claude-3-opus');
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const isMobile = useIsMobile();
  
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);
  
  useEffect(() => {
    const availableModels = getModelsByMode(activeMode).map(model => model.id);
    
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
  }, [activeMode, leftModel]);

  useEffect(() => {
    if (comparing && leftModel === rightModel) {
      const availableModels = getModelsByMode(activeMode).map(model => model.id);
      const differentModel = availableModels.find(m => m !== leftModel);
      
      if (differentModel) {
        setRightModel(differentModel);
        console.log(`Modelo direito atualizado para ${differentModel} para evitar comparação com o mesmo modelo`);
      }
    }
  }, [comparing, leftModel, rightModel, activeMode]);

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
    setIsLinked(!isLinked);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const availableModels = getModelsByMode(activeMode).map(model => model.id);

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

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-inventu-dark/80 to-inventu-darker/90">
      <AppHeader sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
      <div className="flex-1 flex overflow-hidden">
        {sidebarOpen && (
          <div className={`${isMobile ? 'fixed inset-0 z-40 w-[85%] max-w-[280px]' : 'w-[280px] flex-shrink-0'}`}>
            <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={true} />
            {isMobile && (
              <div 
                className="fixed inset-0 bg-black/40 -z-10 backdrop-blur-sm" 
                onClick={toggleSidebar}
              />
            )}
          </div>
        )}
        
        {!sidebarOpen && !isMobile && (
          <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={false} />
        )}

        <div className="flex-1 flex flex-col overflow-hidden items-center justify-center px-2 pb-4">
          <div className="w-full md:max-w-3xl flex flex-col flex-1 bg-card/80 rounded-2xl md:rounded-3xl shadow-xl border border-white/5 overflow-hidden glass-effect my-3 md:my-6">
            <div className="border-b border-white/10 px-4 md:px-8 py-3 md:py-4">
              <h2 className="text-xl md:text-2xl font-semibold text-white text-center tracking-tight">Conversa</h2>
              <div className="mt-2 flex items-center justify-center gap-1 md:gap-2">
                <ModeSelector activeMode={activeMode} onChange={handleModeChange} className="scale-100 md:scale-110" />
                <CompareModelsButton isComparing={comparing} onToggleCompare={toggleComparing} />
                {comparing && (
                  <LinkToggleButton isLinked={isLinked} onToggleLink={toggleLink} />
                )}
                <TokenDisplay />
              </div>
              <div className="mt-2 flex items-center justify-center gap-2 md:gap-3">
                {comparing && (
                  <div className="flex flex-wrap justify-center gap-2">
                    <span className="text-xs text-gray-300 px-2 py-0.5 rounded-xl bg-black/20">Modelo 1: <span className="font-semibold">{leftModel}</span></span>
                    <span className="text-xs text-gray-300 px-2 py-0.5 rounded-xl bg-black/20">Modelo 2: <span className="font-semibold">{rightModel}</span></span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              {comparing ? (
                <div className="flex flex-col md:flex-row flex-1">
                  <div className="flex-1 border-r border-white/5">
                    <ChatInterface
                      messages={messages}
                      model={leftModel}
                      title={leftModel}
                      onModelChange={handleLeftModelChange}
                      availableModels={availableModels}
                      isCompareMode={!isLinked}
                      loading={authLoading || (messagesLoading && !initialLoadDone)}
                    />
                  </div>
                  <div className="flex-1">
                    <ChatInterface
                      messages={messages}
                      model={rightModel}
                      title={rightModel}
                      onModelChange={handleRightModelChange}
                      availableModels={availableModels}
                      isCompareMode={!isLinked}
                      loading={authLoading || (messagesLoading && !initialLoadDone)}
                    />
                  </div>
                </div>
              ) : (
                <ChatInterface
                  messages={messages}
                  model={leftModel}
                  title={leftModel}
                  onModelChange={handleLeftModelChange}
                  availableModels={availableModels}
                  isCompareMode={false}
                  loading={authLoading || (messagesLoading && !initialLoadDone)}
                />
              )}
            </div>

            <div className="p-3 md:p-6 border-t border-white/10 bg-card/60 backdrop-blur-md">
              {(!comparing || isLinked) ? (
                <ChatInput
                  onSendMessage={handleSendMessage}
                  mode={activeMode}
                  model={comparing ? `${leftModel} e ${rightModel}` : leftModel}
                />
              ) : (
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1">
                    <ChatInput
                      onSendMessage={(content, files, params) => handleSendMessage(content, files, params, leftModel)}
                      model={leftModel}
                      mode={activeMode}
                    />
                  </div>
                  <div className="flex-1">
                    <ChatInput
                      onSendMessage={(content, files, params) => handleSendMessage(content, files, params, rightModel)}
                      model={rightModel}
                      mode={activeMode}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
