
import React from 'react';
import ModeIcon from './ModeIcon';
import { ChatMode } from '../ModeSelector';

interface MessageHeaderProps {
  isUser: boolean;
  model?: string;
  mode?: ChatMode;
}

const MessageHeader: React.FC<MessageHeaderProps> = ({ isUser, model, mode }) => {
  return (
    <div className="text-xs opacity-70 mb-1">
      {isUser ? "Você" : model}
      {!isUser && mode && mode !== 'text' && (
        <span className="ml-1 opacity-70">• <ModeIcon mode={mode} className="inline" /></span>
      )}
    </div>
  );
};

export default MessageHeader;
