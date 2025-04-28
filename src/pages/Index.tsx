
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTouchDevice } from '@/hooks/useTouchDevice';
import AppHeader from '@/components/AppHeader';
import ChatInput from '@/components/ChatInput';
import ConversationSidebar from '@/components/ConversationSidebar';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [generationParams, setGenerationParams] = useState<any>({});
  
  const isMobile = useIsMobile();
  const isTouchDevice = useTouchDevice();
  
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

  // Initialize sidebar state based on screen size
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // Sync URL conversationId with state
  useEffect(() => {
    if (conversationId && conversationId !== currentConversationId) {
      setCurrentConversationId(conversationId);
    }
  }, [conversationId, currentConversationId, setCurrentConversationId]);

  // Auto-select appropriate models when mode changes
  useEffect(() => {
    const availableModels = getModelsByMode(activeMode).map(model => model.id);
    
    if (availableModels.length === 0) return;
    
    if (!availableModels.includes(leftModel)) {
      setLeftModel(availableModels[0]);
    }
    
    if (!availableModels.includes(rightModel)) {
      const differentModel = availableModels.find(m => m !== leftModel) || availableModels[0];
      setRightModel(differentModel);
    }
  }, [activeMode, leftModel]);

  // Prevent comparing the same model
  useEffect(() => {
    if (comparing && leftModel === rightModel) {
      const availableModels = getModelsByMode(activeMode).map(model => model.id);
      const differentModel = availableModels.find(m => m !== leftModel);
      
      if (differentModel) {
        setRightModel(differentModel);
      }
    }
  }, [comparing, leftModel, rightModel, activeMode]);

  // Force linked mode on mobile
  useEffect(() => {
    if (isMobile && comparing) {
      setIsLinked(true);
    }
  }, [isMobile, comparing]);

  // Handle sending messages
  const handleSendMessage = useCallback(async (
    content: string, 
    files?: string[], 
    params?: any, 
    targetModel?: string
  ) => {
    const messageParams = params || generationParams;
    
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
          messageParams
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
          messageParams
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
        messageParams
      );
    }
    
    // Auto-close sidebar on mobile after sending a message
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
    
    if (result && result.success && result.modeSwitch) {
      setActiveMode(result.modeSwitch as ChatMode);
      toast.info(`Modo alterado para ${result.modeSwitch}`);
    }
  }, [
    activeMode, 
    comparing, 
    isLinked, 
    leftModel, 
    rightModel, 
    sendMessage, 
    generationParams,
    isMobile,
    sidebarOpen
  ]);

  const toggleComparing = useCallback(() => {
    setComparing(!comparing);
    if (!comparing) {
      setIsLinked(true);
    }
  }, [comparing]);

  const toggleLink = useCallback(() => {
    if (isMobile) return; // Prevent toggling on mobile
    setIsLinked(!isLinked);
  }, [isMobile, isLinked]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const availableModels = getModelsByMode(activeMode).map(model => model.id);

  const handleModeChange = useCallback((newMode: ChatMode) => {
    setActiveMode(newMode);
  }, []);

  const handleLeftModelChange = useCallback((model: string) => {
    setLeftModel(model);
    
    // If comparing, make sure the other model is different
    if (comparing && model === rightModel) {
      const availableModels = getModelsByMode(activeMode).map(m => m.id);
      const differentModel = availableModels.find(m => m !== model);
      if (differentModel) {
        setRightModel(differentModel);
      }
    }
  }, [comparing, rightModel, activeMode]);

  const handleRightModelChange = useCallback((model: string) => {
    setRightModel(model);
    
    // If the selected model is the same as the left model, change the left model
    if (model === leftModel) {
      const availableModels = getModelsByMode(activeMode).map(m => m.id);
      const differentModel = availableModels.find(m => m !== model);
      if (differentModel) {
        setLeftModel(differentModel);
      }
    }
  }, [leftModel, activeMode]);

  const handleParamsChange = useCallback((params: any) => {
    setGenerationParams(params);
  }, []);

  // Mobile-specific comparison header
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

  const isLoading = authLoading || messagesLoading;

  return (
    <div className={cn(
      "flex flex-col h-[100vh] w-full overflow-hidden bg-inventu-darker",
      isTouchDevice && "touch-action-pan-y" // Enable native scrolling on touch devices
    )}>
      <AppHeader sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
      
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar with overlay on mobile */}
        {(sidebarOpen) && (
          <>
            {/* Mobile overlay backdrop */}
            {isMobile && (
              <div 
                className="fixed inset-0 z-30 bg-black/60"
                onClick={toggleSidebar}
              />
            )}
            
            {/* Sidebar content */}
            <div className={cn(
              isMobile ? "fixed left-0 top-0 bottom-0 z-40 w-64" : "w-64 flex-shrink-0",
              "h-full bg-inventu-darker transition-transform",
              isMobile && !sidebarOpen && "-translate-x-full"
            )}>
              <ConversationSidebar 
                onToggleSidebar={toggleSidebar} 
                isOpen={true} 
              />
            </div>
          </>
        )}
        
        <div className={cn(
          "flex-1 flex flex-col overflow-hidden",
          "transition-all duration-300",
          sidebarOpen && !isMobile && "ml-64"
        )}>
          <MobileComparisonHeader />

          <div className={cn(
            "flex-1 flex flex-col md:flex-row overflow-hidden relative min-h-0",
            "bg-inventu-dark",
            "md:rounded-xl md:mx-4 md:my-2",
            isMobile ? "mx-0 my-0" : ""
          )}>
            {comparing ? (
              <ComparisonView
                messages={messages}
                leftModel={leftModel}
                rightModel={rightModel}
                activeMode={activeMode}
                isLinked={isLinked}
                availableModels={availableModels}
                isMobile={isMobile}
                loading={isLoading}
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
                loading={isLoading}
                initialLoadDone={initialLoadDone}
              />
            )}
          </div>
          
          <div className={cn(
            "sticky bottom-0 z-30 border-t border-inventu-gray/30",
            "bg-inventu-dark/95 backdrop-blur-lg"
          )}>
            <ChatControls
              activeMode={activeMode}
              comparing={comparing}
              isLinked={isLinked}
              isMobile={isMobile}
              model={comparing ? `${leftModel},${rightModel}` : leftModel}
              onModeChange={handleModeChange}
              onToggleCompare={toggleComparing}
              onToggleLink={toggleLink}
              onParamsChange={handleParamsChange}
            />
            
            {(!comparing || isLinked || isMobile) && (
              <div className={cn(
                "px-2 mb-1",
                isMobile ? "pb-6" : "pb-2" // Extra padding on mobile for better touch area
              )}>
                <ChatInput 
                  onSendMessage={handleSendMessage} 
                  mode={activeMode}
                  model={comparing ? `${leftModel} e ${rightModel}` : leftModel}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom CSS for touch devices
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .touch-action-pan-y {
      touch-action: pan-y;
    }
    
    /* Increase hit targets on touch devices */
    @media (pointer: coarse) {
      button {
        min-height: 44px;
        min-width: 44px;
      }
      
      input, select, textarea {
        font-size: 16px; /* Prevents iOS zoom on input focus */
      }
    }
  `;
  document.head.appendChild(style);
}

export default Index;
