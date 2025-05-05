
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface UseAPIFrameImageGenerationOptions {
  showToasts?: boolean;
  onProgress?: (progress: number) => void;
  onComplete?: (imageUrl: string) => void;
  onError?: (error: string) => void;
}

export function useAPIFrameImageGeneration(options: UseAPIFrameImageGenerationOptions = {}) {
  const {
    showToasts = true,
    onProgress,
    onComplete,
    onError
  } = options;
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const generateImage = useCallback(async (
    prompt: string,
    modelId: string = "ideogram-v2",
    params: Record<string, any> = {}
  ) => {
    if (isGenerating) {
      if (showToasts) {
        toast.error('Uma geração de imagem já está em andamento');
      }
      return null;
    }
    
    setIsGenerating(true);
    setProgress(10);
    setError(null);
    
    if (onProgress) {
      onProgress(10);
    }
    
    if (showToasts) {
      toast.info('Iniciando geração de imagem', {
        description: `Modelo: ${modelId === "ideogram-v2" ? "Ideogram V2" : "Midjourney"}`
      });
    }
    
    try {
      // Verificar se existe uma chave de API salva no localStorage
      const apiKeyFromStorage = localStorage.getItem('apiframe_api_key');
      if (!apiKeyFromStorage) {
        throw new Error('API Frame API Key não configurada. Configure nas configurações.');
      }
      
      // Atualizar progresso
      setProgress(30);
      if (onProgress) onProgress(30);
      
      console.log(`[useAPIFrameImageGeneration] Gerando imagem com ${modelId}:`, {
        prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
        modelId,
        paramsCount: Object.keys(params).length
      });
      
      // Chamar a Edge Function com a API key no cabeçalho de autorização
      const { data, error } = await supabase.functions.invoke('apiframe-image-generate', {
        body: {
          prompt,
          modelId,
          params
        },
        headers: {
          Authorization: `Bearer ${apiKeyFromStorage}`
        }
      });
      
      if (error) {
        console.error('[useAPIFrameImageGeneration] Erro na Edge Function:', error);
        throw new Error(`Erro na geração: ${error.message}`);
      }
      
      if (!data.success || !data.images || data.images.length === 0) {
        throw new Error('Nenhuma imagem foi gerada');
      }
      
      // Atualizar progresso
      setProgress(100);
      
      // Pegar a primeira imagem gerada
      const imageUrl = data.images[0];
      setGeneratedImageUrl(imageUrl);
      
      if (onProgress) {
        onProgress(100);
      }
      
      if (onComplete) {
        onComplete(imageUrl);
      }
      
      if (showToasts) {
        toast.success('Imagem gerada com sucesso');
      }
      
      return imageUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('[useAPIFrameImageGeneration] Erro:', errorMessage);
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
      
      if (showToasts) {
        toast.error('Falha ao gerar imagem', {
          description: errorMessage
        });
      }
      
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, onComplete, onError, onProgress, showToasts]);
  
  return {
    generateImage,
    isGenerating,
    progress,
    generatedImageUrl,
    error,
    reset: () => {
      setGeneratedImageUrl(null);
      setError(null);
      setProgress(0);
    }
  };
}
