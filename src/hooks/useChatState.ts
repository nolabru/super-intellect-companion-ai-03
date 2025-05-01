
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTouchDevice } from '@/hooks/useTouchDevice';
import { ChatMode } from '@/components/ModeSelector';
import { getModelsByMode } from '@/components/ModelSelector';

export const useChatState = () => {
  const [comparing, setComparing] = useState(false);
  const [isLinked, setIsLinked] = useState(true);
  const [activeMode, setActiveMode] = useState<ChatMode>('text');
  const [leftModel, setLeftModel] = useState('gpt-4o');
  const [rightModel, setRightModel] = useState('claude-3-opus');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [generationParams, setGenerationParams] = useState<any>({});
  
  const isMobile = useIsMobile();
  const isTouchDevice = useTouchDevice();

  // Initialize sidebar state based on screen size
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // Auto-select appropriate models when mode changes
  useEffect(() => {
    const availableModels = getModelsByMode(activeMode).map(model => model.id);
    
    if (availableModels.length === 0) return;
    
    if (!availableModels.includes(leftModel)) {
      setLeftModel(availableModels[0]);
    }
    
    if (!availableModels.includes(rightModel)) {
      const differentModel = availableModels.find(m => m !== leftModel) || availableModels[0];
      setRightModel(differentModel);
    }
  }, [activeMode, leftModel]);

  // Prevent comparing the same model
  useEffect(() => {
    if (comparing && leftModel === rightModel) {
      const availableModels = getModelsByMode(activeMode).map(model => model.id);
      const differentModel = availableModels.find(m => m !== leftModel);
      
      if (differentModel) {
        setRightModel(differentModel);
      }
    }
  }, [comparing, leftModel, rightModel, activeMode]);

  // Force linked mode on mobile
  useEffect(() => {
    if (isMobile && comparing) {
      setIsLinked(true);
    }
  }, [isMobile, comparing]);
  
  const toggleComparing = useCallback(() => {
    setComparing(!comparing);
    if (!comparing) {
      setIsLinked(true);
    }
  }, [comparing]);

  const toggleLink = useCallback(() => {
    if (isMobile) return; // Prevent toggling on mobile
    setIsLinked(!isLinked);
  }, [isMobile, isLinked]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);
  
  const handleModeChange = useCallback((newMode: ChatMode) => {
    setActiveMode(newMode);
  }, []);

  const handleLeftModelChange = useCallback((model: string) => {
    setLeftModel(model);
    
    // If comparing, make sure the other model is different
    if (comparing && model === rightModel) {
      const availableModels = getModelsByMode(activeMode).map(m => m.id);
      const differentModel = availableModels.find(m => m !== model);
      if (differentModel) {
        setRightModel(differentModel);
      }
    }
  }, [comparing, rightModel, activeMode]);

  const handleRightModelChange = useCallback((model: string) => {
    setRightModel(model);
    
    // If the selected model is the same as the left model, change the left model
    if (model === leftModel) {
      const availableModels = getModelsByMode(activeMode).map(m => m.id);
      const differentModel = availableModels.find(m => m !== model);
      if (differentModel) {
        setLeftModel(differentModel);
      }
    }
  }, [leftModel, activeMode]);

  const handleParamsChange = useCallback((params: any) => {
    setGenerationParams(params);
  }, []);
  
  return {
    comparing,
    isLinked,
    activeMode,
    leftModel,
    rightModel,
    sidebarOpen,
    generationParams,
    isMobile,
    isTouchDevice,
    toggleComparing,
    toggleLink,
    toggleSidebar,
    handleModeChange,
    handleLeftModelChange,
    handleRightModelChange,
    handleParamsChange,
    setGenerationParams
  };
};
