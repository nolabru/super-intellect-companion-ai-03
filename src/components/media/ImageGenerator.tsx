
import React, { useState } from 'react';
import UnifiedMediaGenerator from './UnifiedMediaGenerator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// Updated image models data from APIframe
const IMAGE_MODELS = [
  { id: 'sdxl', name: 'Stable Diffusion XL' },
  { id: 'sdxl-turbo', name: 'SDXL Turbo (Fast)' },
  { id: 'kandinsky', name: 'Kandinsky 2.2' },
  { id: 'deepfloyd', name: 'DeepFloyd IF' },
  { id: 'dalle-3', name: 'DALL-E 3' },
  { id: 'midjourney', name: 'Midjourney' },
  // Add Ideogram models
  { id: 'ideogram-v1', name: 'Ideogram V1' },
  { id: 'ideogram-v2', name: 'Ideogram V2' },
  { id: 'ideogram-v1-turbo', name: 'Ideogram V1 Turbo (Fast)' },
  { id: 'ideogram-v2-turbo', name: 'Ideogram V2 Turbo (Fast)' }
];

// Ideogram style types
const IDEOGRAM_STYLES = [
  { id: 'GENERAL', name: 'General' },
  { id: 'REALISTIC', name: 'Realistic' },
  { id: 'RENDER_3D', name: '3D Render' },
  { id: 'ANIME', name: 'Anime' },
  { id: 'PAINTING', name: 'Painting' },
  { id: 'DIGITAL_ART', name: 'Digital Art' },
  { id: 'CARTOON', name: 'Cartoon' },
  { id: 'ILLUSTRATION', name: 'Illustration' }
];

// Aspect ratio options
const ASPECT_RATIOS = [
  { id: 'ASPECT_1_1', name: 'Square (1:1)' },
  { id: 'ASPECT_4_3', name: 'Landscape (4:3)' },
  { id: 'ASPECT_3_4', name: 'Portrait (3:4)' },
  { id: 'ASPECT_16_9', name: 'Wide (16:9)' },
  { id: 'ASPECT_9_16', name: 'Tall (9:16)' }
];

interface ImageGeneratorProps {
  onImageGenerated?: (imageUrl: string) => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onImageGenerated }) => {
  const [quality, setQuality] = useState('standard');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(IMAGE_MODELS[0].id);
  const [ideogramStyle, setIdeogramStyle] = useState('GENERAL');
  const [aspectRatio, setAspectRatio] = useState('ASPECT_1_1');
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [magicPrompt, setMagicPrompt] = useState('AUTO');
  
  // Check if selected model is an Ideogram model
  const isIdeogramModel = (model: string) => model.startsWith('ideogram-');
  
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

      {/* Show Ideogram specific params only when an Ideogram model is selected */}
      {isIdeogramModel(selectedModel) && (
        <>
          <div className="space-y-2">
            <Label htmlFor="ideogramStyle">Style</Label>
            <Select 
              value={ideogramStyle}
              onValueChange={setIdeogramStyle}
            >
              <SelectTrigger id="ideogramStyle">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                {IDEOGRAM_STYLES.map(style => (
                  <SelectItem key={style.id} value={style.id}>{style.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="aspectRatio">Aspect Ratio</Label>
            <Select 
              value={aspectRatio}
              onValueChange={setAspectRatio}
            >
              <SelectTrigger id="aspectRatio">
                <SelectValue placeholder="Select aspect ratio" />
              </SelectTrigger>
              <SelectContent>
                {ASPECT_RATIOS.map(ratio => (
                  <SelectItem key={ratio.id} value={ratio.id}>{ratio.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seedInput">Seed (Optional)</Label>
            <Input
              id="seedInput"
              type="number"
              placeholder="Random seed"
              value={seed || ''}
              onChange={(e) => setSeed(e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="magicPrompt">Magic Prompt</Label>
            <Select 
              value={magicPrompt}
              onValueChange={setMagicPrompt}
            >
              <SelectTrigger id="magicPrompt">
                <SelectValue placeholder="Select magic prompt option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AUTO">Auto</SelectItem>
                <SelectItem value="ON">On</SelectItem>
                <SelectItem value="OFF">Off</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="negativePrompt">Negative Prompt (Optional)</Label>
        <Textarea
          id="negativePrompt"
          placeholder="Things to avoid in the image"
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
        />
      </div>
    </div>
  );

  // Create additional params object based on selected model
  const getAdditionalParams = () => {
    const baseParams = { quality, negativePrompt };
    
    if (isIdeogramModel(selectedModel)) {
      return {
        ...baseParams,
        style_type: ideogramStyle,
        aspect_ratio: aspectRatio,
        seed: seed,
        magic_prompt_option: magicPrompt,
      };
    }
    
    return baseParams;
  };

  // Update selected model handler to reset params when switching model types
  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    
    // Reset ideogram-specific params when switching away from ideogram models
    if (!isIdeogramModel(modelId) && isIdeogramModel(selectedModel)) {
      setIdeogramStyle('GENERAL');
      setAspectRatio('ASPECT_1_1');
      setSeed(undefined);
      setMagicPrompt('AUTO');
    }
  };

  return (
    <UnifiedMediaGenerator
      mediaType="image"
      title="AI Image Generator"
      models={IMAGE_MODELS}
      defaultModel={selectedModel}
      onModelChange={handleModelChange}
      onMediaGenerated={onImageGenerated}
      paramControls={<ParamControls />}
      additionalParams={getAdditionalParams()}
    />
  );
};

export default ImageGenerator;
