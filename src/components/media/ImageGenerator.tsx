
import React, { useState } from 'react';
import UnifiedMediaGenerator from './UnifiedMediaGenerator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Updated image models data from APIframe
const IMAGE_MODELS = [
  { id: 'sdxl', name: 'Stable Diffusion XL' },
  { id: 'sdxl-turbo', name: 'SDXL Turbo (Fast)' },
  { id: 'kandinsky', name: 'Kandinsky 2.2' },
  { id: 'deepfloyd', name: 'DeepFloyd IF' },
  { id: 'dalle-3', name: 'DALL-E 3' },
  { id: 'midjourney', name: 'Midjourney' }
];

interface ImageGeneratorProps {
  onImageGenerated?: (imageUrl: string) => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onImageGenerated }) => {
  const [quality, setQuality] = useState('standard');
  const [negativePrompt, setNegativePrompt] = useState('');
  
  const ParamControls = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="imageQuality">Quality</Label>
        <Select 
          value={quality}
          onValueChange={setQuality}
        >
          <SelectTrigger id="imageQuality">
            <SelectValue placeholder="Select quality" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft (Faster)</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="hd">HD (Slower)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <UnifiedMediaGenerator
      mediaType="image"
      title="AI Image Generator"
      models={IMAGE_MODELS}
      defaultModel="sdxl"
      onMediaGenerated={onImageGenerated}
      paramControls={<ParamControls />}
      additionalParams={{ quality, negativePrompt }}
    />
  );
};

export default ImageGenerator;
