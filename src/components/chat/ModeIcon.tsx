
import React from 'react';
import { Text, Image, Video, AudioLines } from 'lucide-react';
import { ChatMode } from '../ModeSelector';
import { cn } from '@/lib/utils';

interface ModeIconProps {
  mode?: ChatMode;
  size?: number;
  className?: string;
}

const ModeIcon: React.FC<ModeIconProps> = ({ mode, size = 14, className }) => {
  switch (mode) {
    case 'image':
      return <Image size={size} className={cn("mr-1", className)} />;
    case 'video':
      return <Video size={size} className={cn("mr-1", className)} />;
    case 'audio':
      return <AudioLines size={size} className={cn("mr-1", className)} />;
    case 'text':
    default:
      return <Text size={size} className={cn("mr-1", className)} />;
  }
};

export default ModeIcon;
