
import React from "react";
import ModeSelector, { ChatMode } from "@/components/ModeSelector";
import ModelSelector, { getModelsByMode } from "@/components/ModelSelector";
import { cn } from "@/lib/utils";
import { SlidersHorizontal } from "lucide-react";

interface ModeAndModelSelectorBarProps {
  activeMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  comparing: boolean;
  isLinked: boolean;
  leftModel: string;
  rightModel: string;
  onLeftModelChange: (model: string) => void;
  onRightModelChange: (model: string) => void;
  availableModels: string[];
  className?: string;
}

const ModeAndModelSelectorBar: React.FC<ModeAndModelSelectorBarProps> = ({
  activeMode,
  onModeChange,
  comparing,
  isLinked,
  leftModel,
  rightModel,
  onLeftModelChange,
  onRightModelChange,
  availableModels,
  className = "",
}) => {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 bg-inventu-dark/80 border border-inventu-blue/10 rounded-2xl p-2 md:p-3 mb-1 shadow-xl backdrop-blur-xl w-full mx-auto max-w-2xl",
        className
      )}
    >
      <div className="flex items-center gap-2 w-full md:w-auto justify-center">
        <ModeSelector activeMode={activeMode} onChange={onModeChange} />
      </div>
      <div className={cn(
        "flex-1 flex items-center justify-center gap-2 md:gap-4 transition-all w-full"
      )}>
        {comparing ? (
          <>
            <ModelSelector
              selectedModel={leftModel}
              onChange={onLeftModelChange}
              mode={activeMode}
              availableModels={availableModels}
              className="min-w-[112px]"
            />
            <SlidersHorizontal className="h-6 w-6 text-inventu-blue/60" />
            <ModelSelector
              selectedModel={rightModel}
              onChange={onRightModelChange}
              mode={activeMode}
              availableModels={availableModels}
              className="min-w-[112px]"
            />
            {isLinked && (
              <span className="hidden md:inline text-xs text-inventu-blue/70 ml-2">Modos vinculados</span>
            )}
          </>
        ) : (
          <ModelSelector
            selectedModel={leftModel}
            onChange={onLeftModelChange}
            mode={activeMode}
            availableModels={availableModels}
            className="min-w-[112px]"
          />
        )}
      </div>
    </div>
  );
};

export default ModeAndModelSelectorBar;
