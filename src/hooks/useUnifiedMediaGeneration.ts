
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useMediaContext } from '@/contexts/MediaContext';
import useMediaServiceAdapter from '@/adapters/mediaServiceAdapter';

type MediaType = 'image' | 'video' | 'audio';

export function useUnifiedMediaGeneration() {
  const [generating, setGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const { addTask, updateTask } = useMediaContext();
  
  // Use the media service adapter
  const mediaService = useMediaServiceAdapter();

  const generateMedia = useCallback(async (
    type: MediaType,
    prompt: string,
    model: string,
    params = {},
    referenceUrl?: string
  ) => {
    try {
      setGenerating(true);
      setGenerationError(null);
      
      // Create a task in the UI before sending to API
      const taskId = uuidv4();
      addTask({
        id: taskId,
        type,
        prompt,
        status: 'pending',
        model,
        createdAt: new Date()
      });
      
      // Generate the media using the service adapter
      const result = await mediaService.generateMedia(
        type,
        prompt,
        model,
        params,
        referenceUrl
      );
      
      if (result.success) {
        // Update task with success status
        updateTask(taskId, { 
          status: 'completed',
          url: result.mediaUrl
        });
        
        toast.success(`${type} gerado com sucesso!`);
        return {
          success: true,
          url: result.mediaUrl,
          taskId: result.taskId
        };
      } else {
        // Handle the error case - result.error might not exist if success is false
        updateTask(taskId, { 
          status: 'failed', 
          error: result.success === false && typeof result.error === 'string' ? result.error : 'Erro desconhecido'
        });
        
        const errorMessage = result.success === false && typeof result.error === 'string' 
          ? result.error 
          : `Falha ao gerar ${type}`;
        
        setGenerationError(errorMessage);
        toast.error(errorMessage);
        return { success: false };
      }
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'Erro desconhecido');
      toast.error(`Erro ao gerar ${type}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      return { success: false };
    } finally {
      setGenerating(false);
    }
  }, [addTask, updateTask, mediaService]);

  const cancelGeneration = useCallback(async (taskId: string) => {
    try {
      // Cancel the task in the UI first
      updateTask(taskId, { status: 'canceled' });
      
      // Cancel on the API if needed (not implemented in the adapter yet)
      // await mediaService.cancelGeneration(taskId);
      
      return true;
    } catch (err) {
      console.error('Error canceling generation:', err);
      return false;
    }
  }, [updateTask]);

  return {
    generateMedia,
    cancelGeneration,
    generating,
    error: generationError
  };
}
