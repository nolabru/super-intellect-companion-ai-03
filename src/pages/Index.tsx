
import React, { useState } from 'react';
import AppHeader from '@/components/AppHeader';
import ChatInterface from '@/components/ChatInterface';
import ChatInput from '@/components/ChatInput';
import { ChatMode } from '@/components/ModeSelector';
import { useAuth } from '@/contexts/AuthContext';
import { useConversation } from '@/hooks/useConversation';

// Model options for each mode
const MODEL_OPTIONS = {
  text: ['gpt-4o', 'claude-3-opus', 'claude-3-sonnet', 'llama-3'],
  image: ['gpt-4o-vision', 'claude-3-opus', 'gemini-pro-vision'],
  video: ['gpt-4o-vision', 'claude-3-opus'],
  audio: ['whisper-large-v3', 'deepgram-nova-2']
};

const Index: React.FC = () => {
  const [comparing, setComparing] = useState(true);
  const [isLinked, setIsLinked] = useState(true);
  const [leftModel, setLeftModel] = useState('gpt-4o');
  const [rightModel, setRightModel] = useState('claude-3-opus');
  const [activeMode, setActiveMode] = useState<ChatMode>('text');
  const { loading: authLoading } = useAuth();
  const { 
    messages, 
    sendMessage, 
    loading: messagesLoading 
  } = useConversation();

  const handleSendMessage = (content: string, mode: ChatMode, model: string) => {
    // Update active mode when message is sent
    setActiveMode(mode);
    
    sendMessage(
      content, 
      mode, 
      model, 
      comparing, 
      leftModel, 
      rightModel
    );
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

  return (
    <div className="flex flex-col h-screen bg-inventu-darker">
      <AppHeader />
      
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative rounded-xl mx-4 my-2 bg-inventu-dark">
        {comparing ? (
          <>
            <div className="flex-1 border-r border-inventu-gray/30">
              <ChatInterface 
                messages={messages} 
                model={leftModel} 
                title={leftModel}
                onModelChange={setLeftModel}
                availableModels={MODEL_OPTIONS[activeMode]}
                isCompareMode={true}
                loading={authLoading || messagesLoading}
              />
            </div>
            
            <div className="flex-1">
              <ChatInterface 
                messages={messages} 
                model={rightModel} 
                title={rightModel}
                onModelChange={setRightModel}
                availableModels={MODEL_OPTIONS[activeMode]}
                isCompareMode={true}
                loading={authLoading || messagesLoading}
              />
            </div>
          </>
        ) : (
          <div className="flex-1">
            <ChatInterface 
              messages={messages} 
              model={leftModel} 
              title={leftModel}
              onModelChange={setLeftModel}
              availableModels={MODEL_OPTIONS[activeMode]}
              isCompareMode={false}
              loading={authLoading || messagesLoading}
            />
          </div>
        )}
      </div>
      
      <ChatInput 
        onSendMessage={handleSendMessage} 
        isLinked={isLinked}
        onToggleLink={toggleLink}
        onToggleCompare={toggleComparing}
        isSplitView={comparing}
        activeModelLeft={leftModel}
        activeModelRight={rightModel}
        onModelChangeLeft={setLeftModel}
        onModelChangeRight={setRightModel}
      />
    </div>
  );
};

export default Index;
