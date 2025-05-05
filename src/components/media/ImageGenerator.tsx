import React, { useState } from 'react';
import UnifiedMediaGenerator from './UnifiedMediaGenerator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { tokenService } from '@/services/tokenService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// Updated image models data - now all under API Frame
const IMAGE_MODELS = [
  { id: 'ideogram-v2', name: 'Ideogram V2', tokens: 300 },
  { id: 'midjourney', name: 'Midjourney', tokens: 500 }
];

// Ideogram style types
const IDEOGRAM_STYLES = [
  { id: 'GENERAL', name: 'General' },
  { id: 'ANIME', name: 'Anime' },
  { id: 'ILLUSTRATION', name: 'Illustration' },
  { id: 'PHOTOGRAPHY', name: 'Photography' },
  { id: 'PIXEL_ART', name: 'Pixel Art' },
  { id: 'COMIC_BOOK', name: 'Comic Book' },
  { id: 'CRAFT_CLAY', name: 'Craft Clay' },
  { id: 'DIGITAL_ART', name: 'Digital Art' },
  { id: 'ENHANCE', name: 'Enhance' },
  { id: 'FANTASY_ART', name: 'Fantasy Art' },
  { id: 'ISOMETRIC', name: 'Isometric' },
  { id: 'LINE_ART', name: 'Line Art' },
  { id: 'NEON_PUNK', name: 'Neon Punk' },
  { id: 'ORIGAMI', name: 'Origami' },
  { id: 'PHOTOGRAPHIC', name: 'Photographic' },
  { id: 'CINEMATIC', name: 'Cinematic' },
  { id: '3D_MODEL', name: '3D Model' },
];

// Aspect ratios
const ASPECT_RATIOS = [
  { id: 'ASPECT_1_1', name: '1:1 Square', midjourney: '1:1' },
  { id: 'ASPECT_16_9', name: '16:9 Landscape', midjourney: '16:9' },
  { id: 'ASPECT_9_16', name: '9:16 Portrait', midjourney: '9:16' },
  { id: 'ASPECT_4_3', name: '4:3 Classic', midjourney: '4:3' },
  { id: 'ASPECT_3_2', name: '3:2 Classic', midjourney: '3:2' },
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
  const { user } = useAuth();
  
  // Display token requirements when model changes
  const handleModelChange = async (newModel: string) => {
    setSelectedModel(newModel);
    
    // Get token cost for selected model
    const selectedModelInfo = IMAGE_MODELS.find(model => model.id === newModel);
    
    if (selectedModelInfo && user) {
      try {
        const tokenInfo = await tokenService.getUserTokenBalance(user.id);
        if (tokenInfo) {
          toast.info(`Model ${selectedModelInfo.name} requires ${selectedModelInfo.tokens} tokens per image`, {
            description: `You have ${tokenInfo.tokensRemaining} tokens available`,
            duration: 4000
          });
        }
      } catch (error) {
        console.error("Error fetching token balance:", error);
      }
    }
  };
  
  const ParamControls = () => (
    <div className="space-y-4">
      {/* Model selection */}
      <div className="space-y-2">
        <Label htmlFor="modelSelect">Model</Label>
        <Select 
          value={selectedModel}
          onValueChange={handleModelChange}
        >
          <SelectTrigger id="modelSelect">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            {IMAGE_MODELS.map(model => (
              <SelectItem key={model.id} value={model.id}>
                {model.name} ({model.tokens} tokens)
              </SelectItem>
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
      onModelChange={handleModelChange}
      onMediaGenerated={onImageGenerated}
      paramControls={<ParamControls />}
      additionalParams={getAdditionalParams()}
    />
  );
};

export default ImageGenerator;
