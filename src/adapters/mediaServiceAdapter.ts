
import { useMediaGeneration } from '@/hooks/useMediaGeneration';
import { useApiframeGeneration } from '@/hooks/useApiframeGeneration';
import { MediaGenerationParams, MediaServiceOptions } from '@/types/mediaGeneration';

// Adaptador para unificar diferentes serviços de geração de mídia
export function useMediaServiceAdapter(provider: 'piapi' | 'apiframe', options: MediaServiceOptions = { showToasts: true }) {
  // Hooks para os diferentes serviços
  const piapiService = useMediaGeneration(options);
  const apiframeService = useApiframeGeneration(options);

  // Determinar o serviço a ser usado com base no provedor
  const service = provider === 'piapi' ? piapiService : apiframeService;
  
  // Gerar mídia usando o serviço selecionado
  const generateMedia = async (
    type: 'image' | 'video' | 'audio',
    prompt: string,
    model: string,
    params: MediaGenerationParams = {},
    referenceUrl?: string
  ) => {
    return await service.generateMedia(prompt, type, model, params, referenceUrl);
  };

  // Cancelar geração em andamento (apenas para PIAPI)
  const cancelGeneration = async () => {
    if (provider === 'piapi' && 'cancelGeneration' in service) {
      return await piapiService.cancelGeneration();
    }
    return false;
  };

  // Verificar status da tarefa (apenas para PIAPI)
  const checkTaskStatus = async (taskId: string, type: 'image' | 'video' | 'audio') => {
    if (provider === 'piapi' && 'checkTaskStatus' in piapiService) {
      return await piapiService.checkTaskStatus(taskId, type);
    }
    return null;
  };

  // Configurar chave API (apenas para APIframe)
  const configureApiKey = (apiKey: string): boolean => {
    if (provider === 'apiframe' && 'configureApiKey' in apiframeService) {
      return apiframeService.configureApiKey(apiKey);
    }
    return false;
  };

  // Verificar se a chave API está configurada (apenas para APIframe)
  const isApiKeyConfigured = (): boolean => {
    if (provider === 'apiframe' && 'isApiKeyConfigured' in apiframeService) {
      return apiframeService.isApiKeyConfigured();
    }
    return false;
  };

  return {
    isGenerating: service.isGenerating,
    taskProgress: 'taskProgress' in piapiService ? piapiService.taskProgress : 0,
    currentTask: 'currentTask' in piapiService ? piapiService.currentTask : null,
    generatedMediaUrl: 'generatedMediaUrl' in piapiService ? piapiService.generatedMediaUrl : null,
    generateMedia,
    cancelGeneration,
    checkTaskStatus,
    configureApiKey,
    isApiKeyConfigured
  };
}
