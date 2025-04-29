
import React, { useState } from 'react';
import UnifiedMediaGenerator from './UnifiedMediaGenerator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Image models data
const IMAGE_MODELS = [
  { id: 'sdxl', name: 'Stable Diffusion XL' },
  { id: 'sdxl-turbo', name: 'SDXL Turbo' },
  { id: 'kandinsky', name: 'Kandinsky' },
  { id: 'deepfloyd', name: 'DeepFloyd' },
  { id: 'dalle-3', name: 'DALL-E 3' }
];

interface ImageGeneratorProps {
  onImageGenerated?: (imageUrl: string) => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onImageGenerated }) => {
  const [quality, setQuality] = useState('standard');
  
  const ParamControls = () => (
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
  );

  return (
    <UnifiedMediaGenerator
      mediaType="image"
      title="AI Image Generator"
      models={IMAGE_MODELS}
      defaultModel="sdxl"
      onMediaGenerated={onImageGenerated}
      paramControls={<ParamControls />}
    />
  );
};

export default ImageGenerator;
