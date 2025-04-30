
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { X, Loader2 } from 'lucide-react';

interface MediaProgressProps {
  progress: number;
  type: 'image' | 'video' | 'audio';
  onCancel?: () => void;
}

const MediaProgress: React.FC<MediaProgressProps> = ({
  progress,
  type,
  onCancel
}) => {
  // Map media type to friendly label
  const typeLabel = {
    'image': 'Image',
    'video': 'Video',
    'audio': 'Audio'
  }[type];
  
  return (
    <div className="space-y-2 py-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm font-medium">
            Generating {typeLabel}...
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {Math.round(progress)}%
        </span>
      </div>
      <Progress value={progress} className="h-2" />
      
      {onCancel && (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancel}
            className="flex items-center gap-1 h-7 text-xs"
          >
            <X className="h-3 w-3" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

export default MediaProgress;
