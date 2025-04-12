
import React from 'react';
import { ImageIcon, VideoIcon, MicIcon, Type } from 'lucide-react';
import { ChatMode } from '../ModeSelector';

interface ModeIconProps {
  mode: ChatMode;
  className?: string;
}

const ModeIcon: React.FC<ModeIconProps> = ({ mode, className = '' }) => {
  const iconProps = {
    className: `h-4 w-4 ${className}`
  };

  switch (mode) {
    case 'image':
      return <ImageIcon {...iconProps} />;
    case 'video':
      return <VideoIcon {...iconProps} />;
    case 'audio':
      return <MicIcon {...iconProps} />;
    default:
      return <Type {...iconProps} />;
  }
};

export default ModeIcon;

