
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Simple image models data
const IMAGE_MODELS = [
  { id: 'sdxl', name: 'Stable Diffusion XL' },
  { id: 'sdxl-turbo', name: 'SDXL Turbo (Fast)' },
  { id: 'dalle-3', name: 'DALL-E 3' }
];

interface ImageGeneratorProps {
  onImageGenerated?: (imageUrl: string) => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onImageGenerated }) => {
  const [quality, setQuality] = useState('standard');
  const [selectedModel, setSelectedModel] = useState('sdxl');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGenerate = () => {
    // Placeholder for future implementation
    console.log('Image generation would start here with:', {
      prompt,
      model: selectedModel,
      quality
    });
    
    setIsGenerating(true);
    
    // Simulate generation with timeout
    setTimeout(() => {
      setIsGenerating(false);
      
      // Notify that image generation is not available
      alert('Image generation has been removed from this version.');
    }, 1500);
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-4 border rounded-lg">
      <h2 className="text-xl font-bold">AI Image Generator</h2>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Model</Label>
          <Select 
            value={selectedModel}
            onValueChange={setSelectedModel}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {IMAGE_MODELS.map(model => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Quality</Label>
          <Select 
            value={quality}
            onValueChange={setQuality}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select quality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft (Faster)</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="hd">HD (Slower)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <button 
          className="w-full py-2 px-4 bg-blue-600 text-white rounded disabled:bg-blue-300"
          disabled={isGenerating || !prompt}
          onClick={handleGenerate}
        >
          {isGenerating ? 'Generating...' : 'Generate Image'}
        </button>
        
        <p className="text-xs text-center text-gray-500">
          Note: Image generation functionality has been removed.
        </p>
      </div>
    </div>
  );
};

export default ImageGenerator;
