
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { ChatMode } from '@/components/ModeSelector';
import { withRetry } from '@/utils/retryOperations';

export const useMediaGallery = () => {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  /**
   * Faz download da mídia e salva no Supabase Storage
   */
  const downloadAndStoreMedia = async (
    mediaUrl: string,
    mediaType: ChatMode,
    userId: string
  ): Promise<string | null> => {
    try {
      console.log('Iniciando download da mídia:', mediaUrl);
      
      // Verificar se a URL é válida
      if (!mediaUrl || typeof mediaUrl !== 'string') {
        throw new Error('URL de mídia inválida');
      }

      // Obter a extensão apropriada com base no tipo de mídia
      let fileExtension = '';
      if (mediaType === 'image') {
        fileExtension = '.png';
      } else if (mediaType === 'video') {
        fileExtension = '.mp4';
      } else if (mediaType === 'audio') {
        fileExtension = '.mp3';
      }

      // Gerar nome de arquivo único
      const fileName = `${uuidv4()}${fileExtension}`;
      const bucketName = 'media_gallery';
      const filePath = `${userId}/${fileName}`;

      // Verificar se o bucket existe e criar se não existir
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        console.log('Criando bucket de mídia:', bucketName);
        const { error: bucketError } = await supabase.storage.createBucket(bucketName, {
          public: true,
        });
        
        if (bucketError) throw bucketError;
      }

      // Fazer download do arquivo
      const response = await fetch(mediaUrl);
      
      if (!response.ok) {
        throw new Error(`Erro ao fazer download da mídia: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Fazer upload para o Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from(bucketName)
        .upload(filePath, blob, {
          contentType: blob.type,
          upsert: true
        });
        
      if (uploadError) throw uploadError;
      
      // Obter URL pública do arquivo
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
        
      if (!publicUrlData.publicUrl) {
        throw new Error('Não foi possível obter a URL pública do arquivo');
      }
      
      console.log('Mídia salva com sucesso no Storage:', publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
      
    } catch (error) {
      console.error('Erro ao fazer download e armazenar mídia:', error);
      throw error;
    }
  };

  const saveMediaToGallery = async (
    mediaUrl: string,
    prompt: string,
    mediaType: ChatMode,
    modelId?: string,
    metadata: any = {}
  ) => {
    try {
      if (saving) return; // Prevent multiple simultaneous saves
      
      setSaving(true);

      // Verificar se o usuário está autenticado
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        console.log('Usuário não autenticado, não salvando na galeria');
        return;
      }

      // Verificar se a URL de mídia é válida
      if (!mediaUrl || typeof mediaUrl !== 'string') {
        throw new Error('URL de mídia inválida');
      }

      // Fazer download da mídia e salvar no Storage (para URLs externas)
      let storageUrl = mediaUrl;
      if (mediaUrl.startsWith('http') && !mediaUrl.includes(window.location.hostname)) {
        try {
          const savedUrl = await downloadAndStoreMedia(mediaUrl, mediaType, userData.user.id);
          if (savedUrl) {
            storageUrl = savedUrl;
          }
        } catch (error) {
          console.error('Erro ao armazenar mídia no Storage:', error);
          // Continuar com a URL original se falhar o download
        }
      }

      // Preparar os dados para inserção
      const mediaData = {
        id: uuidv4(),
        user_id: userData.user.id,
        media_url: storageUrl,
        prompt,
        media_type: mediaType,
        model_id: modelId,
        metadata: {
          ...metadata,
          saved_at: new Date().toISOString(),
          source: 'chat',
          original_url: mediaUrl !== storageUrl ? mediaUrl : undefined
        }
      };

      // Inserir na tabela de mídia
      const { error } = await supabase
        .from('media_gallery')
        .insert([mediaData]);

      if (error) throw error;

      console.log('Mídia salva na galeria com sucesso');
      toast.success("Mídia salva na galeria com sucesso");
      
      return true;
    } catch (error) {
      console.error('Erro ao salvar mídia na galeria:', error);
      toast.error("Não foi possível salvar a mídia na galeria: " + 
        (error instanceof Error ? error.message : "Erro desconhecido"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  /**
   * Deletes media from gallery and storage with retry mechanism and enhanced verification
   */
  const deleteMediaFromGallery = async (mediaId: string): Promise<boolean> => {
    try {
      if (deleting) return false; // Prevent multiple deletion attempts
      
      setDeleting(true);
      console.log('[deleteMediaFromGallery] Iniciando exclusão de mídia com ID:', mediaId);

      toast.loading('Excluindo arquivo...');

      // Get the media item to find out storage path
      const { data: mediaItem, error: fetchError } = await supabase
        .from('media_gallery')
        .select('*')
        .eq('id', mediaId)
        .single();

      if (fetchError) {
        console.error('[deleteMediaFromGallery] Erro ao buscar item de mídia:', fetchError);
        toast.error("Não foi possível encontrar o item para exclusão");
        return false;
      }

      if (!mediaItem) {
        console.error('[deleteMediaFromGallery] Item não encontrado com o ID:', mediaId);
        toast.error("Item não encontrado no banco de dados");
        return false;
      }

      console.log('[deleteMediaFromGallery] Mídia encontrada:', mediaItem);

      // Check if this media is stored in our storage
      if (mediaItem?.media_url && mediaItem.media_url.includes('media_gallery')) {
        try {
          // Extract the path from the URL
          const storageUrl = new URL(mediaItem.media_url);
          const pathParts = storageUrl.pathname.split('/');
          // The path should be something like /storage/v1/object/public/media_gallery/user_id/filename
          // We need to extract the part after media_gallery/
          const bucketPath = pathParts.slice(pathParts.indexOf('media_gallery') + 1).join('/');
          
          if (bucketPath) {
            console.log('[deleteMediaFromGallery] Removendo arquivo do storage:', bucketPath);
            
            // Delete the file from storage with retry
            await withRetry(
              async () => {
                const { error: storageError } = await supabase.storage
                  .from('media_gallery')
                  .remove([bucketPath]);
                  
                if (storageError) {
                  console.warn('[deleteMediaFromGallery] Falha ao excluir arquivo do storage:', storageError);
                  throw storageError;
                }
                
                console.log('[deleteMediaFromGallery] Arquivo removido com sucesso do storage');
                return true;
              },
              {
                maxRetries: 5,
                initialDelay: 500,
                onRetry: (error, attemptNumber) => {
                  console.log(`[deleteMediaFromGallery] Tentativa ${attemptNumber} de excluir arquivo do storage após erro:`, error);
                }
              }
            );
          }
        } catch (storageError) {
          console.warn('[deleteMediaFromGallery] Erro ao analisar URL do storage:', storageError);
          // Continue with database deletion even if storage deletion fails
        }
      }

      console.log('[deleteMediaFromGallery] Prosseguindo com a exclusão do registro no banco de dados para o ID:', mediaId);

      // Delete the record from the database with retry
      let deleteSuccess = false;
      let retryCount = 0;
      const maxRetries = 5;
      
      while (!deleteSuccess && retryCount < maxRetries) {
        try {
          retryCount++;
          
          const { error: deleteError } = await supabase
            .from('media_gallery')
            .delete()
            .eq('id', mediaId);

          if (deleteError) {
            console.error(`[deleteMediaFromGallery] Erro ao excluir mídia do banco de dados (tentativa ${retryCount}/${maxRetries}):`, deleteError);
            
            if (retryCount < maxRetries) {
              // Esperar antes de tentar novamente (exponential backoff)
              const delay = 500 * Math.pow(2, retryCount - 1);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            
            throw deleteError;
          }
          
          console.log('[deleteMediaFromGallery] Mídia excluída com sucesso do banco de dados (tentativa bem-sucedida)');
          deleteSuccess = true;
          break;
        } catch (error) {
          if (retryCount >= maxRetries) {
            console.error('[deleteMediaFromGallery] Todas as tentativas de exclusão falharam:', error);
            throw error;
          }
        }
      }

      // Verify deletion was successful by checking if item still exists
      if (deleteSuccess) {
        // Esperar um momento para garantir que o banco de dados tenha atualizado
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: checkItem, error: checkError } = await supabase
          .from('media_gallery')
          .select('*')
          .eq('id', mediaId)
          .maybeSingle();
        
        if (checkError) {
          console.warn('[deleteMediaFromGallery] Erro ao verificar exclusão:', checkError);
        }
        
        if (checkItem) {
          console.error('[deleteMediaFromGallery] ALERTA: Item ainda existe no banco de dados após exclusão:', mediaId);
          
          // Última tentativa de exclusão forçada
          const { error: forceDeleteError } = await supabase
            .from('media_gallery')
            .delete()
            .eq('id', mediaId);
          
          if (forceDeleteError) {
            console.error('[deleteMediaFromGallery] Erro na tentativa final de exclusão:', forceDeleteError);
            toast.error("Falha ao excluir o arquivo");
            return false;
          }
          
          // Verificação final
          const { data: finalCheck } = await supabase
            .from('media_gallery')
            .select('*')
            .eq('id', mediaId)
            .maybeSingle();
            
          if (finalCheck) {
            toast.error("Erro ao excluir o arquivo");
            return false;
          }
        }
        
        console.log('[deleteMediaFromGallery] Confirmado: Item excluído com sucesso');
        toast.success("Arquivo excluído com sucesso");
        return true;
      }
      
      if (!deleteSuccess) {
        toast.error("Falha ao excluir o arquivo");
        return false;
      }
      
      return deleteSuccess;
    } catch (error) {
      console.error('[deleteMediaFromGallery] Erro ao excluir mídia da galeria:', error);
      toast.error("Erro ao excluir o arquivo: " + (error instanceof Error ? error.message : "Erro desconhecido"));
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return {
    saveMediaToGallery,
    deleteMediaFromGallery,
    saving,
    deleting
  };
};
