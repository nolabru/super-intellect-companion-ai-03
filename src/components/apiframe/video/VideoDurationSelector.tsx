
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface VideoDurationSelectorProps {
  duration: string;
  onDurationChange: (duration: string) => void;
  disabled?: boolean;
}

const VideoDurationSelector: React.FC<VideoDurationSelectorProps> = ({
  duration,
  onDurationChange,
  disabled
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="duration">Duration (seconds)</Label>
      <Input
        id="duration"
        type="number"
        min="1"
        max="60"
        value={duration}
        onChange={(e) => onDurationChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
};

export default VideoDurationSelector;
