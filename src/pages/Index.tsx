
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
        // Modo vinculado: enviar para ambos os modelos
        result = await sendMessage(
          content, 
          activeMode, 
          leftModel, // Pode ser qualquer um dos modelos, pois estamos enviando para ambos
          true,      // Modo de comparação ativo
          leftModel, 
          rightModel,
          files,
          params
        );
      } else {
        // Modo desvinculado: enviar apenas para o modelo específico
        if (!targetModel) {
          console.error("Modelo alvo não especificado no modo desvinculado");
          return;
        }
        
        // No modo desvinculado, não estamos em modo de comparação verdadeiro
        // para o modelo específico, então definimos comparing como false
        result = await sendMessage(
          content,
          activeMode,
          targetModel,
          true, // Mantemos o modo de comparação, mas indicamos qual é o modelo-alvo específico
          targetModel === leftModel ? leftModel : null,
          targetModel === rightModel ? rightModel : null,
          files,
          params
        );
      }
    } else {
      // Modo único - enviar apenas para o modelo selecionado
      result = await sendMessage(
        content, 
        activeMode, 
        leftModel, 
        false,   // Não é comparação
        leftModel, 
        null,
        files,
        params
      );
    }
    
    // Check if mode was switched by orchestrator
    if (result && result.success && result.modeSwitch) {
      // Update UI to reflect new mode
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
        {sidebarOpen ? (
          <div className="w-64 flex-shrink-0 bg-inventu-dark/90 backdrop-blur-lg shadow-lg border-r border-white/10">
            <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={true} />
          </div>
        ) : (
          <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={false} />
        )}

        {/* Central Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden items-center justify-center px-2 pb-4">
          <div className="w-full md:max-w-3xl flex flex-col flex-1 bg-card/80 rounded-3xl shadow-xl border border-white/5 overflow-hidden glass-effect my-6">
            <div className="border-b border-white/10 px-8 py-5">
              <h2 className="text-2xl font-semibold text-white text-center tracking-tight">Conversa</h2>
              <div className="mt-2 flex items-center justify-center gap-2">
                {/* Apple-like mode selector */}
                <ModeSelector activeMode={activeMode} onChange={handleModeChange} className="scale-110" />
                <CompareModelsButton isComparing={comparing} onToggleCompare={toggleComparing} />
                {comparing && (
                  <LinkToggleButton isLinked={isLinked} onToggleLink={toggleLink} />
                )}
                <TokenDisplay />
              </div>
              <div className="mt-2 flex items-center justify-center gap-3">
                {/* Mostra nome dos modelos somente ao comparar */}
                {comparing && (
                  <>
                    <span className="text-xs text-gray-300 px-2 py-0.5 rounded-xl bg-black/20">Modelo 1: <span className="font-semibold">{leftModel}</span></span>
                    <span className="text-xs text-gray-300 px-2 py-0.5 rounded-xl bg-black/20">Modelo 2: <span className="font-semibold">{rightModel}</span></span>
                  </>
                )}
              </div>
            </div>

            {/* Interface de mensagens */}
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

            {/* Input area */}
            <div className="p-6 border-t border-white/10 bg-card/60 backdrop-blur-md">
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
