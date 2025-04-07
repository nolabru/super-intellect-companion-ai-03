
import React, { useState } from 'react';
import AppHeader from '@/components/AppHeader';
import ChatInterface from '@/components/ChatInterface';
import ChatInput from '@/components/ChatInput';
import CompareModelsButton from '@/components/CompareModelsButton';
import { ChatMode } from '@/components/ModeSelector';
import { MessageType } from '@/components/ChatMessage';
import { v4 as uuidv4 } from 'uuid';

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
              />
            </div>
            
            <div className="flex-1">
              <ChatInterface 
                messages={messages} 
                model={rightModel} 
                title={rightModel}
              />
            </div>
            
            <CompareModelsButton 
              onClick={toggleComparing} 
              isComparing={comparing} 
            />
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
