
import React, { useState, useEffect } from 'react';
import { Send, Plus, Loader2, Mic, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from '@/lib/utils';
import { ChatMode } from '../ModeSelector';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import ParametersManager from './parameters/ParametersManager';

interface ChatControlsProps {
  onSendMessage: (message: string, params?: any) => void;
  isLoading?: boolean;
  mode: ChatMode;
  inputValue: string;
  onInputChange: (value: string) => void;
  onModeChange?: (mode: ChatMode) => void;
  onStopGeneration?: () => void;
  onClearChat?: () => void;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

const ChatControls: React.FC<ChatControlsProps> = ({
  onSendMessage,
  isLoading = false,
  mode,
  inputValue = '', // Add default value here to prevent undefined
  onInputChange,
  onModeChange,
  onStopGeneration,
  onClearChat,
  className,
  disabled = false,
  autoFocus = true
}) => {
  const [params, setParams] = useState<any>({});
  const [isParametersOpen, setIsParametersOpen] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure inputValue is not undefined before calling trim()
    if (!inputValue || !inputValue.trim() || isLoading || disabled) return;
    
    onSendMessage(inputValue, params);
    onInputChange('');
  };

  // Show parameters button only for image and video modes
  const showParametersButton = mode !== 'text' && mode !== 'audio' && mode !== 'music';

  return (
    <div className={cn("relative", className)}>
      {showParametersButton && (
        <Collapsible
          open={isParametersOpen}
          onOpenChange={setIsParametersOpen}
          className="mb-2"
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-xs flex items-center gap-1 mb-1"
            >
              {isParametersOpen ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              Parâmetros
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ParametersManager 
              mode={mode} 
              onChange={setParams} 
              params={params} 
            />
          </CollapsibleContent>
        </Collapsible>
      )}
      
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2"
      >
        <Textarea
          placeholder={mode === 'text' ? "Digite sua mensagem..." : 
                      mode === 'image' ? "Descreva a imagem que deseja gerar..." :
                      mode === 'video' ? "Descreva o vídeo que deseja gerar..." :
                      mode === 'audio' ? "Digite o texto que deseja converter para áudio..." :
                      mode === 'music' ? "Descreva a música que deseja gerar..." :
                      "Digite sua mensagem..."}
          className="min-h-[60px] max-h-[200px] bg-inventu-card border-inventu-gray/30"
          value={inputValue || ''} // Ensure value is never undefined
          onChange={(e) => onInputChange(e.target.value)}
          disabled={isLoading || disabled}
          autoFocus={autoFocus}
        />
        
        {isLoading && onStopGeneration ? (
          <Button 
            type="button" 
            size="icon" 
            variant="destructive"
            onClick={onStopGeneration}
          >
            <X className="h-5 w-5" />
          </Button>
        ) : (
          <Button 
            type="submit"
            size="icon"
            disabled={!inputValue?.trim() || isLoading || disabled} // Add null check with ?. operator
          >
            {isLoading ? 
              <Loader2 className="h-5 w-5 animate-spin" /> : 
              <Send className="h-5 w-5" />
            }
          </Button>
        )}
      </form>
    </div>
  );
};

export default ChatControls;
