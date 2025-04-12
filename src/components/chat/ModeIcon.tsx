
import React from 'react';
import { Text, Image, Video, AudioLines } from 'lucide-react';
import { ChatMode } from '../ModeSelector';

interface ModeIconProps {
  mode?: ChatMode;
}

const ModeIcon: React.FC<ModeIconProps> = ({ mode }) => {
  switch (mode) {
    case 'image':
      return <Image size={14} className="mr-1" />;
    case 'video':
      return <Video size={14} className="mr-1" />;
    case 'audio':
      return <AudioLines size={14} className="mr-1" />;
    case 'text':
    default:
      return <Text size={14} className="mr-1" />;
  }
};

export default ModeIcon;
