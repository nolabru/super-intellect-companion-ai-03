
import React, { useState } from 'react';
import AppHeader from '@/components/AppHeader';
import ChatInterface from '@/components/ChatInterface';
import ChatInput from '@/components/ChatInput';
import ConversationSidebar from '@/components/ConversationSidebar';
import { ChatMode } from '@/components/ModeSelector';
import { useAuth } from '@/contexts/AuthContext';
import { useConversation } from '@/hooks/useConversation';
import ModeSelector from '@/components/ModeSelector';
import ModelSelector from '@/components/ModelSelector';
import CompareModelsButton from '@/components/CompareModelsButton';
import { Button } from '@/components/ui/button';
import { Link as LinkIcon, Link2Off } from 'lucide-react';

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { loading: authLoading } = useAuth();
  const { 
    messages, 
    sendMessage, 
    loading: messagesLoading 
  } = useConversation();

  const handleSendMessage = (content: string) => {
    // Update active mode when message is sent
    sendMessage(
      content, 
      activeMode, 
      comparing ? leftModel : leftModel, 
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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex flex-col h-screen bg-inventu-darker">
      <AppHeader />
      
      <div className="flex-1 flex overflow-hidden">
        {sidebarOpen && (
          <div className="w-64 flex-shrink-0">
            <ConversationSidebar onToggleSidebar={toggleSidebar} />
          </div>
        )}
        
        <div className="flex-1 flex flex-col overflow-hidden relative">
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
          
          <div className="p-4 border-t border-inventu-gray/30 bg-inventu-dark">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <ModeSelector activeMode={activeMode} onChange={setActiveMode} />
              <CompareModelsButton isComparing={comparing} onToggleCompare={toggleComparing} />
            </div>
            
            <ChatInput 
              onSendMessage={handleSendMessage} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
