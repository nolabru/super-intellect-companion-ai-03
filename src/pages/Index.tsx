
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
    loading: messagesLoading 
  } = useConversation();

  // Quando o modo muda, atualize os modelos para modelos compatíveis com o novo modo
  useEffect(() => {
    const availableModels = getModelsByMode(activeMode).map(model => model.id);
    
    // Se não houver modelos disponíveis para este modo, não faça nada
    if (availableModels.length === 0) {
      console.error(`Nenhum modelo disponível para o modo ${activeMode}`);
      return;
    }
    
    // Verificar se os modelos atuais estão disponíveis no novo modo
    if (!availableModels.includes(leftModel)) {
      setLeftModel(availableModels[0]);
      console.log(`Modelo esquerdo atualizado para ${availableModels[0]} devido à mudança para o modo ${activeMode}`);
    }
    
    if (!availableModels.includes(rightModel)) {
      // Escolha um modelo diferente do leftModel para evitar comparações do mesmo modelo
      const differentModel = availableModels.find(m => m !== leftModel) || availableModels[0];
      setRightModel(differentModel);
      console.log(`Modelo direito atualizado para ${differentModel} devido à mudança para o modo ${activeMode}`);
    }
  }, [activeMode]);

  // Garantir que os modelos selecionados sejam diferentes quando em modo de comparação
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
        files,
        params
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
        files,
        params
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
    console.log(`Modo alterado de ${activeMode} para ${newMode}`);
    setActiveMode(newMode);
    // Os modelos serão atualizados pelo useEffect
  };

  const handleLeftModelChange = (model: string) => {
    console.log(`Modelo esquerdo alterado para ${model}`);
    setLeftModel(model);
    
    // Se estiver em modo de comparação e o novo modelo esquerdo for igual ao modelo direito,
    // atualize o modelo direito para um diferente
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
    
    // Se o novo modelo direito for igual ao modelo esquerdo,
    // atualize o modelo esquerdo para um diferente
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
                    loading={authLoading || messagesLoading}
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
                    loading={authLoading || messagesLoading}
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
