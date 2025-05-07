
import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { ChatMode } from '@/components/ModeSelector';
import { withRetry } from '@/utils/retryOperations';

export const useMediaGallery = () => {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef<string | null>(null);
  
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
   * Deletes media from gallery and storage with improved verification and retry logic
   */
  const deleteMediaFromGallery = async (mediaId: string): Promise<boolean> => {
    // Prevent multiple deletion operations on the same media
    if (deleting || deletingRef.current === mediaId) {
      console.warn(`[deleteMediaFromGallery] Already deleting media ${mediaId}, ignoring duplicate request`);
      return false;
    }

    try {
      // Set deleting state and reference
      setDeleting(true);
      deletingRef.current = mediaId;
      
      console.log('[deleteMediaFromGallery] Starting deletion of media with ID:', mediaId);
      
      // Show deletion in progress toast
      const toastId = toast.loading('Deletando mídia...');

      // Get the media item to find out storage path
      const { data: mediaItem, error: fetchError } = await supabase
        .from('media_gallery')
        .select('*')
        .eq('id', mediaId)
        .maybeSingle();

      if (fetchError) {
        console.error('[deleteMediaFromGallery] Error fetching media item:', fetchError);
        toast.error("Não foi possível encontrar o item para exclusão", { id: toastId });
        return false;
      }

      if (!mediaItem) {
        // The item may have already been deleted, consider this a success
        console.log('[deleteMediaFromGallery] Item not found with ID:', mediaId);
        toast.success("Item excluído com sucesso", { id: toastId });
        return true;
      }

      console.log('[deleteMediaFromGallery] Media found:', mediaItem);

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
            console.log('[deleteMediaFromGallery] Removing file from storage:', bucketPath);
            
            // Delete the file from storage with retry
            await withRetry(
              async () => {
                const { error: storageError } = await supabase.storage
                  .from('media_gallery')
                  .remove([bucketPath]);
                  
                if (storageError) {
                  console.warn('[deleteMediaFromGallery] Failed to delete file from storage:', storageError);
                  throw storageError;
                }
                
                console.log('[deleteMediaFromGallery] File successfully removed from storage');
                return true;
              },
              {
                maxRetries: 3,
                initialDelay: 300,
                onRetry: (error, attemptNumber) => {
                  console.log(`[deleteMediaFromGallery] Attempt ${attemptNumber} to delete file from storage after error:`, error);
                }
              }
            );
          }
        } catch (storageError) {
          console.warn('[deleteMediaFromGallery] Error parsing storage URL:', storageError);
          // Continue with database deletion even if storage deletion fails
        }
      }

      // Add a small delay before database operations to ensure storage operations complete
      await new Promise(resolve => setTimeout(resolve, 300));

      // Implement retry logic for database deletion
      const success = await withRetry(
        async () => {
          // CRITICAL PART: Delete record from database
          console.log('[deleteMediaFromGallery] Attempting to delete database record for ID:', mediaId);
          
          // First step: delete the record
          const { error: deleteError } = await supabase
            .from('media_gallery')
            .delete()
            .eq('id', mediaId);

          if (deleteError) {
            console.error('[deleteMediaFromGallery] Error deleting media from database:', deleteError);
            toast.error("Error deleting the file: " + deleteError.message, { id: toastId });
            throw deleteError; // Throw error to trigger retry
          }
          
          // Second step: verify item no longer exists
          // Using maybeSingle is safer as it doesn't throw if no item exists
          // Add small delay to allow operation to propagate
          await new Promise(resolve => setTimeout(resolve, 300));
          
          const { data: checkItem } = await supabase
            .from('media_gallery')
            .select('id')
            .eq('id', mediaId)
            .maybeSingle();
            
          if (checkItem) {
            console.warn('[deleteMediaFromGallery] WARNING: Item still exists in database after deletion:', mediaId);
            throw new Error('Item still exists after deletion'); // For retry
          }
          
          console.log('[deleteMediaFromGallery] Media successfully deleted from database');
          toast.success("Arquivo excluído com sucesso", { id: toastId });
          
          // Add a small delay to let toast appear before state changes
          await new Promise(resolve => setTimeout(resolve, 300));
          
          return true;
        },
        {
          maxRetries: 3,
          initialDelay: 500,
          factor: 1.5,
          retryCondition: (error) => {
            // Retry on specific errors that indicate the operation might succeed if retried
            console.log('[deleteMediaFromGallery] Evaluating retry for error:', error);
            return true;
          },
          onRetry: (error, attemptNumber) => {
            console.log(`[deleteMediaFromGallery] Attempt ${attemptNumber} to delete record in database after error:`, error);
          }
        }
      ).catch((finalError) => {
        console.error('[deleteMediaFromGallery] Failed all attempts to delete media:', finalError);
        toast.error("Não foi possível excluir o arquivo após várias tentativas", { id: toastId });
        return false;
      });

      return success;
    } catch (error) {
      console.error('[deleteMediaFromGallery] Error deleting media from gallery:', error);
      toast.error("Erro ao excluir o arquivo: " + 
        (error instanceof Error ? error.message : "Erro desconhecido"));
      return false;
    } finally {
      // Reset deletion state and reference with slight delay
      setTimeout(() => {
        setDeleting(false);
        deletingRef.current = null;
      }, 500);
    }
  };

  return {
    saveMediaToGallery,
    deleteMediaFromGallery,
    saving,
    deleting
  };
};
