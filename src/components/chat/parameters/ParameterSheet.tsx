
import React from 'react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { ChatMode } from '@/components/ModeSelector';
import ImageParameters from './ImageParameters';
import AudioParameters from './AudioParameters';

interface ParameterSheetProps {
  mode: ChatMode;
  model: string;
  onParamsChange: (params: any) => void;
}

const ParameterSheet: React.FC<ParameterSheetProps> = ({
  mode,
  model,
  onParamsChange
}) => {
  const getParameterComponent = () => {
    switch (mode) {
      case 'image':
        return <ImageParameters model={model} onParamsChange={onParamsChange} />;
      case 'audio':
        return <AudioParameters model={model} onParamsChange={onParamsChange} />;
      default:
        return null;
    }
  };

  if (mode === 'text' || mode === 'video' || mode === 'call') return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          size="icon" 
          variant="ghost" 
          className="rounded-full w-10 h-10 bg-white/5 hover:bg-white/10"
        >
          <Settings2 className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="bottom" 
        className="h-[80vh] bg-inventu-darker border-t border-white/10 rounded-t-3xl px-4"
      >
        <div className="py-4 space-y-6">
          <div className="flex justify-center">
            <div className="w-12 h-1 rounded-full bg-white/10" />
          </div>
          <h3 className="text-lg font-semibold text-white">
            Parâmetros de Geração
          </h3>
          {getParameterComponent()}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ParameterSheet;
