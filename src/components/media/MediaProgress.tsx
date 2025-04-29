
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

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
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>Generating {type.charAt(0).toUpperCase() + type.slice(1)}...</Label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {Math.round(progress)}%
          </span>
          {onCancel && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 rounded-full" 
              onClick={onCancel}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      <Progress value={progress} />
    </div>
  );
};

export default MediaProgress;
