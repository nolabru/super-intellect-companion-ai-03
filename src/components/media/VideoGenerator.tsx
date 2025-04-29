
import React, { useState } from 'react';
import UnifiedMediaGenerator from './UnifiedMediaGenerator';
import ReferenceUploader from './ReferenceUploader';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

// Video models data
const VIDEO_MODELS = [
  { id: 'kling-text', name: 'Pika Labs (Text to Video)', requiresReference: false },
  { id: 'kling-img', name: 'Pika Labs (Image to Video)', requiresReference: true },
  { id: 'runway-gen2', name: 'Runway Gen-2', requiresReference: false },
  { id: 'luma-text', name: 'Luma AI (Text)', requiresReference: false },
  { id: 'luma-img', name: 'Luma AI (Image to Video)', requiresReference: true }
];

interface VideoGeneratorProps {
  onVideoGenerated?: (videoUrl: string) => void;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ onVideoGenerated }) => {
  const [duration, setDuration] = useState(10);
  const [aspectRatio, setAspectRatio] = useState("16:9");

  const ParamControls = () => (
    <>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Duration (seconds)</Label>
          <span className="text-sm">{duration}s</span>
        </div>
        <Slider
          min={3}
          max={30}
          step={1}
          value={[duration]}
          onValueChange={(values) => setDuration(values[0])}
        />
      </div>
    </>
  );

  return (
    <UnifiedMediaGenerator
      mediaType="video"
      title="AI Video Generator"
      models={VIDEO_MODELS}
      defaultModel="kling-text"
      onMediaGenerated={onVideoGenerated}
      paramControls={<ParamControls />}
      referenceUploader={<ReferenceUploader label="Reference Image" />}
    />
  );
};

export default VideoGenerator;
