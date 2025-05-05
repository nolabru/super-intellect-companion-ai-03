
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Menu, RefreshCw } from 'lucide-react';
import EnhancedModelSelector from '@/components/EnhancedModelSelector';
import RefinedModeSelector from './RefinedModeSelector';
import { ChatMode } from '../ModeSelector';
import ParametersManager from './parameters/ParametersManager';
import { GenerationParameters } from '@/types/parameters';

interface ChatControlsProps {
  mode: ChatMode;
  model: string;
  onModelChange: (model: string) => void;
  onModeChange: (mode: ChatMode) => void;
  onToggleSidebar: () => void;
  onClearChat?: () => void;
  showBackButton?: boolean;
  onBackClick?: () => void;
  params?: GenerationParameters;
  onParamsChange?: (params: GenerationParameters) => void;
  className?: string;
}

const ChatControls: React.FC<ChatControlsProps> = ({
  mode,
  model,
  onModelChange,
  onModeChange,
  onToggleSidebar,
  onClearChat,
  showBackButton,
  onBackClick,
  params,
  onParamsChange,
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-2 w-full ${className}`}>
      {showBackButton && onBackClick ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={onBackClick}
          className="rounded-full bg-white/5 hover:bg-white/10"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="rounded-full bg-white/5 hover:bg-white/10"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      <div className="flex-1 mx-1">
        <RefinedModeSelector activeMode={mode} onChange={onModeChange} />
      </div>

      <div className="flex-1">
        <EnhancedModelSelector
          mode={mode}
          selectedModel={model}
          onChange={onModelChange}
        />
      </div>

      {onClearChat && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClearChat}
          className="rounded-full bg-white/5 hover:bg-white/10"
        >
          <RefreshCw className="h-5 w-5" />
        </Button>
      )}

      {onParamsChange && params && (
        <ParametersManager
          mode={mode}
          model={model}
          onParamsChange={onParamsChange}
          initialParams={params}
          variant="icon"
        />
      )}
    </div>
  );
};

export default ChatControls;
