
import React from 'react';
import { ChatMode } from '../ModeSelector';
import { MessageSquare, Image, Film, Music } from 'lucide-react';

interface MessageHeaderProps {
  isUser: boolean;
  model?: string;
  mode?: ChatMode;
}

const MessageHeader: React.FC<MessageHeaderProps> = ({
  isUser,
  model,
  mode
}) => {
  // Only show header for AI messages
  if (isUser) return null;
  
  // Get the appropriate icon based on the message mode
  const getIcon = () => {
    switch (mode) {
      case 'image':
        return <Image className="h-4 w-4 mr-1" />;
      case 'video':
        return <Film className="h-4 w-4 mr-1" />;
      case 'audio':
        return <Music className="h-4 w-4 mr-1" />;
      default:
        return <MessageSquare className="h-4 w-4 mr-1" />;
    }
  };
  
  return (
    <div className="flex items-center text-white/70 text-xs font-medium mb-2">
      {getIcon()}
      <span>{model || 'AI'}</span>
    </div>
  );
};

export default MessageHeader;
