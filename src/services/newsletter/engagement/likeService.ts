
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { canPerformOperation, recordExists } from './utils';

/**
 * Incrementa a contagem de curtidas de um post
 * @param postId ID do post
 * @param userId ID do usuário
 * @returns Promise<boolean> Sucesso da operação
 */
export const incrementLikeCount = async (postId: string, userId: string): Promise<boolean> => {
  const operationKey = `like_${postId}_${userId}`;
  if (!canPerformOperation(operationKey)) {
    return false; // Evita curtidas duplicadas em sequência rápida
  }
  
  try {
    // Verificar se o usuário já curtiu o post
    const hasLiked = await recordExists('post_likes', { post_id: postId, user_id: userId });
    
    if (hasLiked) {
      toast.error('Você já curtiu este post');
      return false;
    }
    
    // Registrar curtida
    const { error: likeError } = await supabase
      .from('post_likes')
      .insert([{ post_id: postId, user_id: userId }]);
    
    if (likeError) {
      console.error('Erro ao registrar curtida:', likeError);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Erro ao incrementar curtidas:', err);
    return false;
  }
};

/**
 * Verifica se o usuário já curtiu o post
 * @param postId ID do post
 * @param userId ID do usuário
 * @returns Promise<boolean> True se o usuário já curtiu
 */
export const hasUserLikedPost = async (postId: string, userId: string): Promise<boolean> => {
  if (!userId) return false;
  
  const operationKey = `check_like_${postId}_${userId}`;
  if (!canPerformOperation(operationKey)) {
    // Retornar cache (assumindo não curtido para não mostrar falsos positivos)
    return false;
  }
  
  try {
    return await recordExists('post_likes', { post_id: postId, user_id: userId });
  } catch (err) {
    console.error('Erro ao verificar curtida do usuário:', err);
    return false;
  }
};
