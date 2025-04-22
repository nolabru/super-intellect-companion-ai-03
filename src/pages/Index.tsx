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
import ModeAndModelSelectorBar from '@/components/ModeAndModelSelectorBar';

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
    <div className="flex flex-col h-screen bg-gradient-to-br from-inventu-dark to-inventu-darker w-full">
      <AppHeader sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
      <div className="flex-1 flex overflow-hidden relative">
        {sidebarOpen && (
          <>
            <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={true} />
            {isMobile && (
              <div 
                className="fixed inset-0 bg-black/50 -z-10 backdrop-blur-sm"
                onClick={toggleSidebar}
              />
            )}
          </>
        )}
        {!sidebarOpen && !isMobile && (
          <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={false} />
        )}
        <main className="flex-1 flex flex-col overflow-hidden items-center justify-center px-1.5 pb-1.5 md:px-2 md:pb-4 w-full">
          <div className={`
            w-full max-w-full md:max-w-3xl
            flex flex-col flex-1 bg-inventu-card/90 rounded-xl md:rounded-2xl shadow-xl 
            border border-white/5 overflow-hidden backdrop-blur-md my-1.5 md:my-4
            min-h-[80vh]
          `}>
            <div className="border-b border-white/5 px-2.5 md:px-6 py-2 md:py-3">
              <h2 className="text-base md:text-xl font-semibold text-white text-center tracking-tight">Conversa</h2>
              <div className="mt-2 flex justify-center">
                <ModeAndModelSelectorBar
                  activeMode={activeMode}
                  onModeChange={handleModeChange}
                  comparing={comparing}
                  isLinked={isLinked}
                  leftModel={leftModel}
                  rightModel={rightModel}
                  onLeftModelChange={handleLeftModelChange}
                  onRightModelChange={handleRightModelChange}
                  availableModels={availableModels}
                />
              </div>
              <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1 md:gap-2">
                <CompareModelsButton isComparing={comparing} onToggleCompare={toggleComparing} />
                {comparing && (
                  <LinkToggleButton isLinked={isLinked} onToggleLink={toggleLink} />
                )}
                <TokenDisplay />
              </div>
              {comparing && (
                <div className="mt-1.5 flex flex-wrap justify-center gap-1.5">
                  <span className="text-xs text-white/70 px-2 py-0.5 rounded-lg bg-white/5">Modelo 1: <span className="font-medium">{leftModel}</span></span>
                  <span className="text-xs text-white/70 px-2 py-0.5 rounded-lg bg-white/5">Modelo 2: <span className="font-medium">{rightModel}</span></span>
                </div>
              )}
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              {comparing ? (
                <div className="flex flex-col md:flex-row flex-1">
                  <div className="flex-1 md:border-r border-white/5 min-w-0">
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
                  <div className="flex-1 min-w-0">
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
            <div className="p-1.5 md:p-4 border-t border-white/5 bg-inventu-card/60 backdrop-blur-md">
              {(!comparing || isLinked) ? (
                <ChatInput
                  onSendMessage={handleSendMessage}
                  mode={activeMode}
                  model={comparing ? `${leftModel} e ${rightModel}` : leftModel}
                />
              ) : (
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="flex-1 min-w-0">
                    <ChatInput
                      onSendMessage={(content, files, params) => handleSendMessage(content, files, params, leftModel)}
                      model={leftModel}
                      mode={activeMode}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
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
        </main>
      </div>
    </div>
  );
};

export default Index;
