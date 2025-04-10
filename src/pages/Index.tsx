import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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

const Index: React.FC = () => {
  const [comparing, setComparing] = useState(false);
  const [isLinked, setIsLinked] = useState(true);
  const [activeMode, setActiveMode] = useState<ChatMode>('text');
  const [leftModel, setLeftModel] = useState('gpt-4o');
  const [rightModel, setRightModel] = useState('claude-3-opus');
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
  
  useEffect(() => {
    if (conversationId && conversationId !== currentConversationId) {
      console.log(`[Index] ID da conversa na URL: ${conversationId}, atualizando estado`);
      setCurrentConversationId(conversationId);
    }
  }, [conversationId, currentConversationId, setCurrentConversationId]);

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
  }, [activeMode]);

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

  const handleSendMessage = (content: string, files?: string[], params?: any, targetModel?: string) => {
    console.log(`Enviando mensagem "${content}" no modo ${activeMode} para o modelo ${targetModel || leftModel}`, params);
    
    if (!comparing || isLinked) {
      sendMessage(
        content, 
        activeMode, 
        comparing ? leftModel : leftModel, 
        comparing, 
        leftModel, 
        rightModel,
        files,
        params
      );
    } else {
      const actualLeftModel = targetModel === leftModel ? leftModel : null;
      const actualRightModel = targetModel === rightModel ? rightModel : null;
      
      sendMessage(
        content,
        activeMode,
        targetModel || leftModel,
        false,
        actualLeftModel,
        actualRightModel,
        files,
        params
      );
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
    <div className="flex flex-col h-screen bg-inventu-darker">
      <AppHeader sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
      
      <div className="flex-1 flex overflow-hidden">
        {sidebarOpen ? (
          <div className="w-64 flex-shrink-0">
            <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={true} />
          </div>
        ) : (
          <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={false} />
        )}
        
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative rounded-xl mx-4 my-2 bg-inventu-dark">
            {comparing ? (
              <>
                <div className="flex-1 border-r border-inventu-gray/30 flex flex-col">
                  <ChatInterface 
                    messages={messages} 
                    model={leftModel} 
                    title={leftModel}
                    onModelChange={handleLeftModelChange}
                    availableModels={availableModels}
                    isCompareMode={true}
                    loading={authLoading || (messagesLoading && !initialLoadDone)}
                  />
                  {!isLinked && (
                    <div className="p-4 border-t border-inventu-gray/30">
                      <ChatInput 
                        onSendMessage={(content, files, params) => handleSendMessage(content, files, params, leftModel)}
                        model={leftModel}
                        mode={activeMode}
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col">
                  <ChatInterface 
                    messages={messages} 
                    model={rightModel} 
                    title={rightModel}
                    onModelChange={handleRightModelChange}
                    availableModels={availableModels}
                    isCompareMode={true}
                    loading={authLoading || (messagesLoading && !initialLoadDone)}
                  />
                  {!isLinked && (
                    <div className="p-4 border-t border-inventu-gray/30">
                      <ChatInput 
                        onSendMessage={(content, files, params) => handleSendMessage(content, files, params, rightModel)}
                        model={rightModel}
                        mode={activeMode}
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1">
                <ChatInterface 
                  messages={messages} 
                  model={leftModel} 
                  title={leftModel}
                  onModelChange={handleLeftModelChange}
                  availableModels={availableModels}
                  isCompareMode={false}
                  loading={authLoading || (messagesLoading && !initialLoadDone)}
                />
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-inventu-gray/30 bg-inventu-dark">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <ModeSelector activeMode={activeMode} onChange={handleModeChange} />
                <CompareModelsButton isComparing={comparing} onToggleCompare={toggleComparing} />
                {comparing && (
                  <LinkToggleButton isLinked={isLinked} onToggleLink={toggleLink} />
                )}
              </div>
            </div>
            
            {(!comparing || isLinked) && (
              <ChatInput 
                onSendMessage={handleSendMessage} 
                mode={activeMode}
                model={comparing ? `${leftModel} e ${rightModel}` : leftModel}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
