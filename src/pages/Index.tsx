
import React, { useState, useEffect } from 'react';
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
  const [comparing, setComparing] = useState(true);
  const [isLinked, setIsLinked] = useState(true);
  const [activeMode, setActiveMode] = useState<ChatMode>('text');
  const [leftModel, setLeftModel] = useState('gpt-4o');
  const [rightModel, setRightModel] = useState('claude-3-opus');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { loading: authLoading } = useAuth();
  const { 
    messages, 
    sendMessage, 
    loading: messagesLoading 
  } = useConversation();

  // Quando o modo muda, atualize os modelos para modelos compatíveis com o novo modo
  useEffect(() => {
    const availableModels = getModelsByMode(activeMode).map(model => model.id);
    
    // Verificar se os modelos atuais estão disponíveis no novo modo
    if (!availableModels.includes(leftModel)) {
      setLeftModel(availableModels[0] || '');
    }
    
    if (!availableModels.includes(rightModel)) {
      // Escolha um modelo diferente do leftModel para evitar comparações do mesmo modelo
      const differentModel = availableModels.find(m => m !== leftModel) || availableModels[0] || '';
      setRightModel(differentModel);
    }
  }, [activeMode, leftModel, rightModel]);

  const handleSendMessage = (content: string, files?: string[], targetModel?: string) => {
    // Se os chats estiverem vinculados ou não estiver no modo de comparação,
    // envia a mensagem normalmente
    if (!comparing || isLinked) {
      sendMessage(
        content, 
        activeMode, 
        comparing ? leftModel : leftModel, 
        comparing, 
        leftModel, 
        rightModel,
        files
      );
    } else {
      // Se os chats estiverem desvinculados, envia apenas para o modelo especificado
      const actualLeftModel = targetModel === leftModel ? leftModel : null;
      const actualRightModel = targetModel === rightModel ? rightModel : null;
      
      sendMessage(
        content,
        activeMode,
        targetModel || leftModel,
        false, // Sem comparação quando desvinculado
        actualLeftModel,
        actualRightModel,
        files
      );
    }
  };

  const toggleComparing = () => {
    setComparing(!comparing);
    if (!comparing) {
      // When switching to comparison mode, link the chats by default
      setIsLinked(true);
    }
  };

  const toggleLink = () => {
    setIsLinked(!isLinked);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Obter modelos disponíveis para o modo atual
  const availableModels = getModelsByMode(activeMode).map(model => model.id);

  const handleModeChange = (newMode: ChatMode) => {
    setActiveMode(newMode);
    // Os modelos serão atualizados pelo useEffect
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
                    onModelChange={setLeftModel}
                    availableModels={availableModels}
                    isCompareMode={true}
                    loading={authLoading || messagesLoading}
                  />
                  {!isLinked && (
                    <div className="p-4 border-t border-inventu-gray/30">
                      <ChatInput 
                        onSendMessage={(content, files) => handleSendMessage(content, files, leftModel)}
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
                    onModelChange={setRightModel}
                    availableModels={availableModels}
                    isCompareMode={true}
                    loading={authLoading || messagesLoading}
                  />
                  {!isLinked && (
                    <div className="p-4 border-t border-inventu-gray/30">
                      <ChatInput 
                        onSendMessage={(content, files) => handleSendMessage(content, files, rightModel)}
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
                  onModelChange={setLeftModel}
                  availableModels={availableModels}
                  isCompareMode={false}
                  loading={authLoading || messagesLoading}
                />
              </div>
            )}
          </div>
          
          {/* Barra de controle inferior */}
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
            
            {/* Mostrar o input único quando não estiver comparando ou quando os chats estiverem vinculados */}
            {(!comparing || isLinked) && (
              <ChatInput 
                onSendMessage={handleSendMessage} 
                mode={activeMode}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
