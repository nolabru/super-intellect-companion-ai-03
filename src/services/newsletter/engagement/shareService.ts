
import { supabase } from '@/integrations/supabase/client';
import { canPerformOperation, getPostById, updatePost } from './utils';

/**
 * Incrementa a contagem de compartilhamentos de um post
 * @param postId ID do post
 * @returns Promise<boolean> Sucesso da operação
 */
export const incrementShareCount = async (postId: string): Promise<boolean> => {
  const operationKey = `share_${postId}`;
  if (!canPerformOperation(operationKey)) {
    return true; // Ignora compartilhamentos duplicados em sequência rápida
  }
  
  try {
    // Primeiro obtemos a contagem atual de compartilhamentos (ou 0 se não existir)
    const { data: post, error: fetchError } = await getPostById(postId);
    
    if (fetchError) {
      console.error('Erro ao buscar informações do post:', fetchError);
      return false;
    }
    
    // Se o campo shares_count não existe no banco de dados, vamos considerar como 0
    const currentShareCount = post.shares_count !== undefined ? (post.shares_count || 0) : 0;
    
    // Atualizar campo
    const { error } = await supabase
      .from('newsletter_posts')
      .update({ shares_count: currentShareCount + 1 })
      .eq('id', postId);
    
    if (error) {
      console.error('Erro ao incrementar compartilhamentos:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Erro ao incrementar compartilhamentos:', err);
    return false;
  }
};
