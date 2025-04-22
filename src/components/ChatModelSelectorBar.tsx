
import React from 'react';
import ModelSelector from './ModelSelector';

interface ChatModelSelectorBarProps {
  selectedModel: string;
  onModelChange?: (model: string) => void;
  availableModels?: string[];
}

const ChatModelSelectorBar: React.FC<ChatModelSelectorBarProps> = ({
  selectedModel,
  onModelChange,
  availableModels = [],
}) => {
  if (!onModelChange || !availableModels.length) return null;

  return (
    <div className="w-full flex justify-center mb-2">
      <div className="
        bg-black/60 
        rounded-xl 
        px-3 py-1 
        shadow 
        backdrop-blur-md 
        flex justify-center items-center
        border border-white/10
        max-w-xs
      ">
        <ModelSelector 
          selectedModel={selectedModel}
          onChange={onModelChange}
          disabled={!onModelChange}
          compact={true}
        />
      </div>
    </div>
  );
};

export default ChatModelSelectorBar;

