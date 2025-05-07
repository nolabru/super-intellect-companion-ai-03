
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/components/ui/use-toast';
import { ChatMode } from '@/components/ModeSelector';

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
      toast({
        title: "Sucesso",
        description: "Mídia salva na galeria com sucesso",
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao salvar mídia na galeria:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a mídia na galeria: " + 
          (error instanceof Error ? error.message : "Erro desconhecido"),
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  /**
   * Deletes media from gallery and storage
   */
  const deleteMediaFromGallery = async (mediaId: string): Promise<boolean> => {
    try {
      if (deleting) return false; // Prevent multiple deletion attempts
      
      setDeleting(true);
      console.log('Deletando mídia com ID:', mediaId);

      // Get the media item to find out storage path
      const { data: mediaItem, error: fetchError } = await supabase
        .from('media_gallery')
        .select('*')
        .eq('id', mediaId)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar item de mídia:', fetchError);
        throw fetchError;
      }

      console.log('Mídia encontrada:', mediaItem);

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
            console.log('Removendo arquivo do storage:', bucketPath);
            // Delete the file from storage
            const { error: storageError } = await supabase.storage
              .from('media_gallery')
              .remove([bucketPath]);
              
            if (storageError) {
              console.warn('Falha ao excluir arquivo do storage:', storageError);
              // Continue with database deletion even if storage deletion fails
            } else {
              console.log('Arquivo removido com sucesso do storage');
            }
          }
        } catch (storageError) {
          console.warn('Erro ao analisar URL do storage:', storageError);
          // Continue with database deletion even if storage deletion fails
        }
      }

      console.log('Prosseguindo com a exclusão do registro no banco de dados para o ID:', mediaId);

      // Delete the record from the database
      const { error: deleteError } = await supabase
        .from('media_gallery')
        .delete()
        .eq('id', mediaId);

      if (deleteError) {
        console.error('Erro ao excluir mídia do banco de dados:', deleteError);
        throw deleteError;
      }

      console.log('Mídia excluída com sucesso do banco de dados:', mediaId);
      return true;
    } catch (error) {
      console.error('Erro ao excluir mídia da galeria:', error);
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
