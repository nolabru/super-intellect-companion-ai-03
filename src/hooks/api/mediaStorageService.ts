
import { supabase } from '@/integrations/supabase/client';

/**
 * Interface para a resposta da função de armazenamento de mídia
 */
interface StorageResponse {
  success: boolean;
  publicUrl?: string;
  storagePath?: string;
  error?: string;
}

/**
 * Serviço para armazenamento de mídias no Supabase Storage
 */
export const mediaStorageService = {
  /**
   * Salva uma mídia gerada no storage do Supabase
   */
  async storeMedia(
    mediaUrl: string,
    fileName?: string,
    contentType?: string,
    userId?: string,
    conversationId?: string,
    mode?: string
  ): Promise<StorageResponse> {
    try {
      // Check if it's a placeholder or mock URL and reject it
      if (mediaUrl.includes('placeholder.com') || mediaUrl.includes('MockAI')) {
        console.error('[mediaStorageService] Detectada URL de placeholder ou mock, não armazenando:', mediaUrl);
        return {
          success: false,
          error: 'URL de placeholder ou mock detectada, não é possível armazenar'
        };
      }
      
      console.log(`[mediaStorageService] Armazenando mídia no Supabase: ${mediaUrl.startsWith('data:') ? 'base64' : mediaUrl.substring(0, 50) + '...'}`);
      
      const { data, error } = await supabase.functions.invoke('media-storage', {
        body: {
          mediaUrl,
          fileName,
          contentType,
          userId,
          conversationId,
          mode
        },
      });
      
      if (error) {
        console.error('[mediaStorageService] Erro ao armazenar mídia:', error);
        return {
          success: false,
          error: `Erro ao armazenar mídia: ${error.message}`
        };
      }
      
      console.log('[mediaStorageService] Mídia armazenada com sucesso:', data);
      return data;
    } catch (err) {
      console.error('[mediaStorageService] Erro durante armazenamento de mídia:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro desconhecido'
      };
    }
  },
  
  /**
   * Obtém a extensão de arquivo a partir da URL
   */
  getExtensionFromUrl(url: string): string {
    try {
      // Remover parâmetros de query
      const urlWithoutParams = url.split('?')[0];
      
      // Obter a última parte da URL
      const parts = urlWithoutParams.split('/');
      const fileName = parts[parts.length - 1];
      
      // Obter extensão
      const extensionParts = fileName.split('.');
      if (extensionParts.length > 1) {
        return extensionParts[extensionParts.length - 1];
      }
      
      // Se não conseguir determinar, adivinhar pelo tipo
      if (url.includes('video')) return 'mp4';
      if (url.includes('audio')) return 'mp3';
      return 'png'; // Mudado de jpg para png para DALL-E
    } catch (e) {
      return 'png'; // Fallback para DALL-E (mudado de bin para png)
    }
  },
  
  /**
   * Obtém extensão a partir do tipo de conteúdo
   */
  getExtensionFromContentType(contentType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'video/quicktime': 'mov',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav'
    };
    
    return map[contentType] || 'png'; // Padrão para DALL-E (mudado de jpg para png)
  },
  
  /**
   * Obtém o content type com base no modo
   */
  getContentTypeFromMode(mode: string): string {
    switch (mode) {
      case 'video':
        return 'video/mp4';
      case 'audio':
        return 'audio/mpeg';
      case 'image':
        return 'image/png'; // Mudado de image/jpeg para image/png para DALL-E
      default:
        return 'application/octet-stream';
    }
  }
};
