
import React from 'react';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

interface MediaProgressProps {
  progress: number;
  type: 'video' | 'image' | 'audio';
}

const MediaProgress: React.FC<MediaProgressProps> = ({ progress, type }) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>Generating {type}...</Label>
        <span className="text-xs text-muted-foreground">
          {progress}%
        </span>
      </div>
      <Progress value={progress} />
    </div>
  );
};

export default MediaProgress;
