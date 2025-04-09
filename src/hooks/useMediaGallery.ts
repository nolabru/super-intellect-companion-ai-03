
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/components/ui/use-toast';
import { ChatMode } from '@/components/ModeSelector';

export const useMediaGallery = () => {
  const [saving, setSaving] = useState(false);

  const saveMediaToGallery = async (
    mediaUrl: string,
    prompt: string,
    mediaType: ChatMode,
    modelId?: string,
    metadata: any = {}
  ) => {
    try {
      setSaving(true);

      // Verificar se o usuário está autenticado
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        console.log('Usuário não autenticado, não salvando na galeria');
        return;
      }

      // Preparar os dados para inserção
      const mediaData = {
        id: uuidv4(),
        user_id: userData.user.id,
        media_url: mediaUrl,
        prompt,
        media_type: mediaType,
        model_id: modelId,
        metadata
      };

      // Inserir na tabela de mídia
      const { error } = await supabase
        .from('media_gallery')
        .insert([mediaData]);

      if (error) throw error;

      console.log('Mídia salva na galeria com sucesso');
    } catch (error) {
      console.error('Erro ao salvar mídia na galeria:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a mídia na galeria",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    saveMediaToGallery,
    saving
  };
};
