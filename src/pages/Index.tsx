
import React, { useState } from 'react';
import AppHeader from '@/components/AppHeader';
import ChatInterface from '@/components/ChatInterface';
import ChatInput from '@/components/ChatInput';
import CompareModelsButton from '@/components/CompareModelsButton';
import { MessageType } from '@/components/ChatMessage';
import { v4 as uuidv4 } from 'uuid';

const Index: React.FC = () => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [comparing, setComparing] = useState(true);

  const formatTime = (): string => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const handleSendMessage = (content: string) => {
    const newUserMessage: MessageType = {
      id: uuidv4(),
      content,
      sender: 'user',
      model: 'user',
      timestamp: formatTime(),
    };

    // Simulate GPT-4 response
    const gpt4Response: MessageType = {
      id: uuidv4(),
      content: "Olá! Como posso ajudar você hoje?",
      sender: 'ai',
      model: 'gpt4',
      timestamp: formatTime(),
    };

    // Simulate Claude response
    const claudeResponse: MessageType = {
      id: uuidv4(),
      content: "Olá! Como posso ajudar você hoje?",
      sender: 'ai',
      model: 'claude',
      timestamp: formatTime(),
    };

    setMessages([...messages, newUserMessage, gpt4Response, claudeResponse]);
  };

  const toggleComparing = () => {
    setComparing(!comparing);
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
                model="gpt4" 
                title="OpenAI GPT-4"
              />
            </div>
            
            <div className="flex-1">
              <ChatInterface 
                messages={messages} 
                model="claude" 
                title="Anthropic Claude"
              />
            </div>
            
            <CompareModelsButton onClick={toggleComparing} />
          </>
        ) : (
          <div className="flex-1">
            <ChatInterface 
              messages={messages} 
              model="gpt4" 
              title="OpenAI GPT-4"
            />
          </div>
        )}
      </div>
      
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default Index;
