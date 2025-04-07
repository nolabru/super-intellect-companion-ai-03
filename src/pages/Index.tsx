
import React, { useState } from 'react';
import AppHeader from '@/components/AppHeader';
import ChatInterface from '@/components/ChatInterface';
import ChatInput from '@/components/ChatInput';
import { ChatMode } from '@/components/ModeSelector';
import { MessageType } from '@/components/ChatMessage';
import { v4 as uuidv4 } from 'uuid';

// Model options for each mode - moved from ModelSelector to make it accessible here
const MODEL_OPTIONS = {
  text: ['gpt-4o', 'claude-3-opus', 'claude-3-sonnet', 'llama-3'],
  image: ['gpt-4o-vision', 'claude-3-opus', 'gemini-pro-vision'],
  video: ['gpt-4o-vision', 'claude-3-opus'],
  audio: ['whisper-large-v3', 'deepgram-nova-2']
};

const Index: React.FC = () => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [comparing, setComparing] = useState(true);
  const [isLinked, setIsLinked] = useState(true);
  const [leftModel, setLeftModel] = useState('gpt-4o');
  const [rightModel, setRightModel] = useState('claude-3-opus');
  const [activeMode, setActiveMode] = useState<ChatMode>('text');

  const formatTime = (): string => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const handleSendMessage = (content: string, mode: ChatMode, model: string) => {
    // Update active mode when message is sent
    setActiveMode(mode);
    
    const newUserMessage: MessageType = {
      id: uuidv4(),
      content,
      sender: 'user',
      model: 'user',
      timestamp: formatTime(),
      mode
    };

    let newMessages = [...messages, newUserMessage];

    if (comparing && isLinked) {
      // Simulate responses from both models
      const gpt4Response: MessageType = {
        id: uuidv4(),
        content: `Resposta do ${leftModel} para: "${content}"`,
        sender: 'ai',
        model: leftModel,
        timestamp: formatTime(),
        mode
      };

      const claudeResponse: MessageType = {
        id: uuidv4(),
        content: `Resposta do ${rightModel} para: "${content}"`,
        sender: 'ai',
        model: rightModel,
        timestamp: formatTime(),
        mode
      };

      newMessages = [...newMessages, gpt4Response, claudeResponse];
    } else if (comparing && !isLinked) {
      // Only respond with the selected model
      const response: MessageType = {
        id: uuidv4(),
        content: `Resposta do ${model} para: "${content}"`,
        sender: 'ai',
        model,
        timestamp: formatTime(),
        mode
      };

      newMessages = [...newMessages, response];
    } else {
      // Single view mode
      const response: MessageType = {
        id: uuidv4(),
        content: `Resposta do ${model} para: "${content}"`,
        sender: 'ai',
        model,
        timestamp: formatTime(),
        mode
      };

      newMessages = [...newMessages, response];
    }

    setMessages(newMessages);
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
              />
            </div>
          </>
        ) : (
          <div className="flex-1">
            <ChatInterface 
              messages={messages} 
              model={leftModel} 
              title={leftModel}
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
