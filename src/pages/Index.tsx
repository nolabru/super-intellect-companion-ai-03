
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getModelsByMode } from '@/components/ModelSelector';
import { useChatState } from '@/hooks/useChatState';
import { useMessageSending } from '@/hooks/useMessageSending';
import MainLayout from '@/components/layout/MainLayout';
import ChatSidebar from '@/components/layout/ChatSidebar';
import ChatContent from '@/components/chat/ChatContent';
import ChatFooter from '@/components/chat/ChatFooter';
import { useAuth } from '@/contexts/AuthContext';

const Index: React.FC = () => {
  const { 
    comparing, isLinked, activeMode, leftModel, rightModel, 
    sidebarOpen, generationParams, isMobile, isTouchDevice,
    toggleComparing, toggleLink, toggleSidebar, 
    handleModeChange, handleLeftModelChange, handleRightModelChange, handleParamsChange
  } = useChatState();
  
  const { loading: authLoading } = useAuth();
  const { conversationId } = useParams<{ conversationId: string }>();

  const {
    messages,
    messagesLoading,
    initialLoadDone,
    currentConversationId,
    setCurrentConversationId,
    handleSendMessage
  } = useMessageSending(
    activeMode, 
    comparing, 
    isLinked, 
    leftModel, 
    rightModel, 
    generationParams, 
    isMobile, 
    sidebarOpen, 
    (open) => toggleSidebar()
  );

  // Sync URL conversationId with state
  useEffect(() => {
    if (conversationId && conversationId !== currentConversationId) {
      setCurrentConversationId(conversationId);
    }
  }, [conversationId, currentConversationId, setCurrentConversationId]);

  const availableModels = getModelsByMode(activeMode).map(model => model.id);
  const isLoading = authLoading || messagesLoading;

  return (
    <MainLayout 
      sidebarOpen={sidebarOpen} 
      onToggleSidebar={toggleSidebar} 
      isTouchDevice={isTouchDevice}
    >
      <div className="flex flex-1 overflow-hidden">
        <ChatSidebar 
          sidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
          isMobile={isMobile}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatContent 
            comparing={comparing}
            isLinked={isLinked}
            activeMode={activeMode}
            leftModel={leftModel}
            rightModel={rightModel}
            messages={messages}
            availableModels={availableModels}
            isMobile={isMobile}
            loading={isLoading}
            initialLoadDone={initialLoadDone}
            handleLeftModelChange={handleLeftModelChange}
            handleRightModelChange={handleRightModelChange}
            handleSendMessage={handleSendMessage}
          />
          
          <ChatFooter 
            activeMode={activeMode}
            comparing={comparing}
            isLinked={isLinked}
            isMobile={isMobile}
            leftModel={leftModel}
            rightModel={rightModel}
            onModeChange={handleModeChange}
            onToggleCompare={toggleComparing}
            onToggleLink={toggleLink}
            onParamsChange={handleParamsChange}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>
    </MainLayout>
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
