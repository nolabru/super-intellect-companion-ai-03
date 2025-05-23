
import React from 'react';
import { Text, Image, Video, AudioLines, PhoneCall } from 'lucide-react';
import { ChatMode } from '../ModeSelector';
import { cn } from '@/lib/utils';

interface ModeIconProps {
  mode?: ChatMode;
  className?: string;
}

const ModeIcon: React.FC<ModeIconProps> = ({ mode, className }) => {
  switch (mode) {
    case 'image':
      return <Image size={14} className={cn("mr-1", className)} />;
    case 'video':
      return <Video size={14} className={cn("mr-1", className)} />;
    case 'audio':
      return <AudioLines size={14} className={cn("mr-1", className)} />;
    case 'call':
      return <PhoneCall size={14} className={cn("mr-1", className)} />;
    case 'text':
    default:
      return <Text size={14} className={cn("mr-1", className)} />;
  }
};

export default ModeIcon;
export type { ChatMode };
