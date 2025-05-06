
import React, { useState, useCallback } from 'react';
import { ChatMode } from '@/components/ModeSelector';
import RefinedModeSelector from './RefinedModeSelector';
import ChatControls from './ChatControls';
import CompareModelsButton from '@/components/CompareModelsButton';
import LinkToggleButton from '@/components/LinkToggleButton';

interface ChatFooterProps {
  activeMode: ChatMode;
  comparing: boolean;
  isLinked: boolean;
  isMobile: boolean;
  leftModel: string;
  rightModel: string;
  onModeChange: (mode: ChatMode) => void;
  onToggleCompare: () => void;
  onToggleLink: () => void;
  onParamsChange: (params: any) => void;
  onSendMessage: (message: string, params?: any) => void;
  hasActiveConversation?: boolean;
  onCreateConversation?: () => void;
}

const ChatFooter: React.FC<ChatFooterProps> = ({
  activeMode,
  comparing,
  isLinked,
  isMobile,
  leftModel,
  rightModel,
  onModeChange,
  onToggleCompare,
  onToggleLink,
  onParamsChange,
  onSendMessage,
  hasActiveConversation,
  onCreateConversation
}) => {
  const [inputValue, setInputValue] = useState('');
  
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);
  
  return (
    <div className="relative flex flex-col gap-2 px-4 py-3 border-t border-inventu-gray/20 bg-gradient-to-b from-inventu-dark to-inventu-darker">
      <div className="flex items-center justify-between gap-2">
        <RefinedModeSelector 
          activeMode={activeMode} 
          onChange={onModeChange} 
          compact={isMobile}
        />
        
        <div className="flex items-center gap-2">
          <CompareModelsButton 
            isComparing={comparing} 
            onToggleCompare={onToggleCompare} 
            compact={isMobile}
          />
          
          {comparing && !isMobile && (
            <LinkToggleButton 
              isLinked={isLinked} 
              onToggleLink={onToggleLink} 
              disabled={isMobile}
            />
          )}
        </div>
      </div>
      
      <ChatControls 
        mode={activeMode}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onSendMessage={onSendMessage}
      />
    </div>
  );
};

export default ChatFooter;
