
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { MediaGenerationResult } from '@/types/mediaGeneration';
import { apiframeService } from '@/services/apiframeService';

export function useApiframeGeneration(options: { showToasts: boolean } = { showToasts: true }) {
  const { showToasts } = options;
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Gerar mídia usando APIframe
  const generateMedia = useCallback(async (
    prompt: string,
    mediaType: 'image' | 'video' | 'audio',
    model: string,
    params: any = {},
    referenceUrl?: string
  ): Promise<MediaGenerationResult> => {
    try {
      setIsGenerating(true);
      
      // Verificar se a chave API está configurada
      const isConfigured = apiframeService.isApiKeyConfigured();
      
      if (!isConfigured) {
        if (showToasts) {
          toast.error('Chave API do APIframe não configurada. Configure nas configurações.');
        }
        setIsGenerating(false);
        return {
          success: false,
          error: 'Chave API do APIframe não configurada'
        };
      }
      
      // Implementação simulada
      if (showToasts) {
        toast.info('Serviço APIframe em desenvolvimento');
      }
      
      // Adicionar um atraso simulado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsGenerating(false);
      return {
        success: false,
        error: 'Serviço APIframe não está disponível nesta versão'
      };
    } catch (error) {
      setIsGenerating(false);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      if (showToasts) {
        toast.error(`Erro ao gerar mídia com APIframe: ${errorMessage}`);
      }
      
      console.error('Erro ao gerar mídia com APIframe:', error);
      return {
        success: false,
        error: errorMessage
      };
    }
  }, [showToasts]);

  // Configurar chave API
  const configureApiKey = useCallback((apiKey: string): boolean => {
    try {
      const result = apiframeService.setApiKey(apiKey);
      
      if (result) {
        if (showToasts) {
          toast.success('Chave API do APIframe configurada com sucesso');
        }
        return true;
      } else {
        if (showToasts) {
          toast.error('Falha ao configurar chave API do APIframe');
        }
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      if (showToasts) {
        toast.error(`Erro ao configurar chave API: ${errorMessage}`);
      }
      
      console.error('Erro ao configurar chave API do APIframe:', error);
      return false;
    }
  }, [showToasts]);

  // Verificar se a chave API está configurada
  const isApiKeyConfigured = useCallback((): boolean => {
    return apiframeService.isApiKeyConfigured();
  }, []);

  return {
    isGenerating,
    generateMedia,
    configureApiKey,
    isApiKeyConfigured
  };
}
