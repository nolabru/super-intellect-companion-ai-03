
import React, { useState } from 'react';
import UnifiedMediaGenerator from './UnifiedMediaGenerator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// Updated image models data - now including both Ideogram and Midjourney
const IMAGE_MODELS = [
  { id: 'ideogram-v2', name: 'Ideogram V2' },
  { id: 'midjourney', name: 'Midjourney' }
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
  { id: 'ASPECT_1_1', name: 'Square (1:1)', midjourney: '1:1' },
  { id: 'ASPECT_4_3', name: 'Landscape (4:3)', midjourney: '4:3' },
  { id: 'ASPECT_3_4', name: 'Portrait (3:4)', midjourney: '3:4' },
  { id: 'ASPECT_16_9', name: 'Wide (16:9)', midjourney: '16:9' },
  { id: 'ASPECT_9_16', name: 'Tall (9:16)', midjourney: '9:16' }
];

// Midjourney specific options
const MIDJOURNEY_QUALITY_OPTIONS = [
  { id: 'standard', name: 'Standard' },
  { id: 'hd', name: 'HD' }
];

const MIDJOURNEY_STYLE_OPTIONS = [
  { id: 'raw', name: 'Raw' },
  { id: 'cute', name: 'Cute' },
  { id: 'scenic', name: 'Scenic' },
  { id: 'original', name: 'Original' }
];

interface ImageGeneratorProps {
  onImageGenerated?: (imageUrl: string) => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onImageGenerated }) => {
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(IMAGE_MODELS[0].id);
  const [ideogramStyle, setIdeogramStyle] = useState('GENERAL');
  const [aspectRatio, setAspectRatio] = useState('ASPECT_1_1');
  const [magicPrompt, setMagicPrompt] = useState('AUTO');
  
  // Midjourney specific states
  const [mjQuality, setMjQuality] = useState('standard');
  const [mjStyle, setMjStyle] = useState('raw');
  
  const isMidjourney = selectedModel === 'midjourney';
  
  const ParamControls = () => (
    <div className="space-y-4">
      {/* Model selection */}
      <div className="space-y-2">
        <Label htmlFor="modelSelect">Model</Label>
        <Select 
          value={selectedModel}
          onValueChange={setSelectedModel}
        >
          <SelectTrigger id="modelSelect">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            {IMAGE_MODELS.map(model => (
              <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Aspect Ratio - common for both */}
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

      {/* Ideogram specific controls */}
      {!isMidjourney && (
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
      
      {/* Midjourney specific controls */}
      {isMidjourney && (
        <>
          <div className="space-y-2">
            <Label htmlFor="mjQuality">Quality</Label>
            <Select 
              value={mjQuality}
              onValueChange={setMjQuality}
            >
              <SelectTrigger id="mjQuality">
                <SelectValue placeholder="Select quality" />
              </SelectTrigger>
              <SelectContent>
                {MIDJOURNEY_QUALITY_OPTIONS.map(option => (
                  <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="mjStyle">Style</Label>
            <Select 
              value={mjStyle}
              onValueChange={setMjStyle}
            >
              <SelectTrigger id="mjStyle">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                {MIDJOURNEY_STYLE_OPTIONS.map(option => (
                  <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Negative prompt - common for both */}
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
    if (isMidjourney) {
      // Find the corresponding Midjourney format for the selected aspect ratio
      const selectedRatio = ASPECT_RATIOS.find(r => r.id === aspectRatio);
      const mjAspectRatio = selectedRatio ? selectedRatio.midjourney : '1:1';
      
      return {
        negative_prompt: negativePrompt,
        quality: mjQuality,
        aspect_ratio: mjAspectRatio,
        style: mjStyle
      };
    } else {
      // Ideogram params
      return {
        negativePrompt,
        style_type: ideogramStyle,
        aspect_ratio: aspectRatio,
        magic_prompt_option: magicPrompt,
      };
    }
  };

  return (
    <UnifiedMediaGenerator
      mediaType="image"
      title="AI Image Generator"
      models={IMAGE_MODELS}
      defaultModel={selectedModel}
      onModelChange={setSelectedModel}
      onMediaGenerated={onImageGenerated}
      paramControls={<ParamControls />}
      additionalParams={getAdditionalParams()}
    />
  );
};

export default ImageGenerator;
