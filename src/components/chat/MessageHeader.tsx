
import React from 'react';
import { ChatMode } from '../ModeSelector';
import ModeIcon from './ModeIcon';
import { Headphones } from 'lucide-react';

interface MessageHeaderProps {
  isUser: boolean;
  model?: string;
  mode?: ChatMode;
  audioType?: 'speech' | 'music';
}

const MessageHeader: React.FC<MessageHeaderProps> = ({ isUser, model, mode, audioType }) => {
  if (isUser) {
    return <div className="text-sm opacity-70 mb-1">Você</div>;
  }

  return (
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center">
        <ModeIcon mode={mode} className="mr-1.5 h-3.5 w-3.5" />
        <span className="text-sm opacity-70 flex items-center gap-1">
          {model || 'Assistente'}
          {mode === 'audio' && audioType === 'music' && (
            <>
              <span className="mx-1">•</span>
              <Headphones className="h-3 w-3 mr-0.5" />
              <span>Música</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
};

export default MessageHeader;
