
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

// Simple video models data
const VIDEO_MODELS = [
  { id: 'gen-2', name: 'Runway Gen-2' },
  { id: 'pika', name: 'Pika Labs' },
  { id: 'luma', name: 'Luma AI' }
];

interface VideoGeneratorProps {
  onVideoGenerated?: (videoUrl: string) => void;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ onVideoGenerated }) => {
  const [duration, setDuration] = useState(10);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [selectedModel, setSelectedModel] = useState('gen-2');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGenerate = () => {
    // Placeholder for future implementation
    console.log('Video generation would start here with:', {
      prompt,
      model: selectedModel,
      duration,
      aspectRatio
    });
    
    setIsGenerating(true);
    
    // Simulate generation with timeout
    setTimeout(() => {
      setIsGenerating(false);
      
      // Notify that video generation is not available
      alert('Video generation has been removed from this version.');
    }, 1500);
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-4 border rounded-lg">
      <h2 className="text-xl font-bold">AI Video Generator</h2>
      
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
              {VIDEO_MODELS.map(model => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
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
        
        <div className="space-y-2">
          <Label>Aspect Ratio</Label>
          <Select 
            value={aspectRatio}
            onValueChange={setAspectRatio}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select aspect ratio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
              <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
              <SelectItem value="1:1">1:1 (Square)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <button 
          className="w-full py-2 px-4 bg-blue-600 text-white rounded disabled:bg-blue-300"
          disabled={isGenerating || !prompt}
          onClick={handleGenerate}
        >
          {isGenerating ? 'Generating...' : 'Generate Video'}
        </button>
        
        <p className="text-xs text-center text-gray-500">
          Note: Video generation functionality has been removed.
        </p>
      </div>
    </div>
  );
};

export default VideoGenerator;
