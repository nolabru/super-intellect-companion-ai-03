
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import AppHeader from '@/components/AppHeader';
import ChatInterface from '@/components/ChatInterface';
import ChatInput from '@/components/ChatInput';
import ConversationSidebar from '@/components/ConversationSidebar';
import { ChatMode } from '@/components/ModeSelector';
import { useAuth } from '@/contexts/AuthContext';
import { useGoogleAuth } from '@/contexts/google-auth';
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
  const { loading: authLoading, user } = useAuth();
  const { isGoogleConnected } = useGoogleAuth();
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

  useEffect(() => {
    // Exibir mensagem sobre integração com o Google se estiver conectado
    if (isGoogleConnected) {
      toast.success(
        'Integração com Google disponível',
        { 
          description: 'Você pode usar @drive, @sheet, @calendar ou pedir para criar eventos, documentos e planilhas.',
          duration: 5000,
          position: 'bottom-center'
        }
      );
    }
  }, [isGoogleConnected]);

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
        
        result = await sendMessage(
          content,
          activeMode,
          targetModel,
          false, // Não é comparação simultânea, é apenas para um modelo
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
                    isCompareMode={!isLinked} // Só é verdadeiramente modo de comparação se estiver desvinculado
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
                    isCompareMode={!isLinked} // Só é verdadeiramente modo de comparação se estiver desvinculado
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
                <TokenDisplay />
                
                {/* Indicador de integração com o Google */}
                {isGoogleConnected && (
                  <div className="text-xs text-green-400 flex items-center" title="Integração com Google ativa">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>Google integrado</span>
                  </div>
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
