
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getModelsByMode } from '@/components/ModelSelector';
import { useChatState } from '@/hooks/useChatState';
import { useMessageSending } from '@/hooks/useMessageSending';
import { useConversation } from '@/hooks/useConversation';
import MainLayout from '@/components/layout/MainLayout';
import ChatContent from '@/components/chat/ChatContent';
import ChatFooter from '@/components/chat/ChatFooter';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import ConversationSidebar from '@/components/ConversationSidebar';

const Index: React.FC = () => {
  const { 
    comparing, isLinked, activeMode, leftModel, rightModel, 
    sidebarOpen, generationParams, isMobile, isTouchDevice,
    toggleComparing, toggleLink, toggleSidebar, 
    handleModeChange, handleLeftModelChange, handleRightModelChange, handleParamsChange
  } = useChatState();
  
  const { user, loading: authLoading } = useAuth();
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const [creatingConversation, setCreatingConversation] = useState(false);
  
  const conversation = useConversation();
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
    () => toggleSidebar()
  );

  // Sync URL conversationId with state
  useEffect(() => {
    if (conversationId && conversationId !== currentConversationId) {
      setCurrentConversationId(conversationId);
    }
  }, [conversationId, currentConversationId, setCurrentConversationId]);

  // Create a new conversation if there isn't one and we're not already creating one
  useEffect(() => {
    // Only run if:
    // 1. We're not already creating a conversation
    // 2. We're not currently loading conversations
    // 3. Initial load of conversations is done
    // 4. There's no current conversation ID
    // 5. We're not on a specific conversation page
    if (
      !creatingConversation &&
      !conversation.loading &&
      conversation.initialLoadDone &&
      !currentConversationId &&
      !conversationId
    ) {
      const createNewConversation = async () => {
        try {
          console.log('[Index] No conversation selected. Creating a new one...');
          setCreatingConversation(true);
          const success = await conversation.createNewConversation();
          
          if (success) {
            console.log('[Index] New conversation created successfully');
          } else {
            console.error('[Index] Failed to create new conversation');
            toast.error('Erro ao criar nova conversa');
          }
        } catch (err) {
          console.error('[Index] Error creating new conversation:', err);
          toast.error('Erro ao criar nova conversa');
        } finally {
          setCreatingConversation(false);
        }
      };
      
      createNewConversation();
    }
  }, [
    conversation,
    creatingConversation,
    currentConversationId,
    conversationId,
    navigate
  ]);

  const handleCreateConversation = async () => {
    if (creatingConversation) return;
    
    try {
      setCreatingConversation(true);
      toast.loading('Criando nova conversa...');
      const success = await conversation.createNewConversation();
      
      if (success) {
        toast.success('Nova conversa criada com sucesso');
      } else {
        toast.error('Erro ao criar nova conversa');
      }
    } catch (err) {
      console.error('[Index] Error creating conversation:', err);
      toast.error('Erro ao criar nova conversa');
    } finally {
      setCreatingConversation(false);
    }
  };

  const availableModels = getModelsByMode(activeMode).map(model => model.id);
  const isLoading = authLoading || messagesLoading || creatingConversation;
  
  // Check if there's an active conversation
  const hasActiveConversation = !!currentConversationId;

  if (creatingConversation) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-inventu-darker to-inventu-dark">
        <div className="flex flex-col items-center gap-4 p-8 rounded-lg bg-black/20 backdrop-blur-sm">
          <Loader2 className="h-10 w-10 animate-spin text-inventu-primary" />
          <p className="text-white text-lg font-medium">Criando nova conversa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-inventu-darker">
      {!isMobile && (
        <div className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
          <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={true} />
        </div>
      )}

      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm transition-opacity"
          onClick={toggleSidebar}
        >
          <div 
            className="fixed inset-y-0 left-0 z-40 w-64 transform bg-inventu-dark"
            onClick={e => e.stopPropagation()}
          >
            <ConversationSidebar onToggleSidebar={toggleSidebar} isOpen={true} />
          </div>
        </div>
      )}

      <div className={`flex min-h-screen w-full flex-col transition-all duration-300 ${
        !isMobile && sidebarOpen && "pl-64"
      }`}>
        <MainLayout 
          sidebarOpen={sidebarOpen} 
          onToggleSidebar={toggleSidebar} 
          isTouchDevice={isTouchDevice}
        >
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
              hasActiveConversation={hasActiveConversation}
              onCreateConversation={handleCreateConversation}
            />
          </div>
        </MainLayout>
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
