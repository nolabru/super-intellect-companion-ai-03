
import { toast } from 'sonner';
import { canPerformOperation, getPostById, updatePost } from './utils';

/**
 * Incrementa a contagem de visualizações de um post
 * @param postId ID do post
 * @returns Promise<boolean> Sucesso da operação
 */
export const incrementViewCount = async (postId: string): Promise<boolean> => {
  const operationKey = `view_${postId}`;
  if (!canPerformOperation(operationKey)) {
    return true; // Ignora operações duplicadas em sequência rápida
  }
  
  try {
    // Primeiro obtemos a contagem atual de visualizações
    const { data: post, error: fetchError } = await getPostById(postId);
    
    if (fetchError) {
      console.error('Erro ao buscar contagem de visualizações:', fetchError);
      return false;
    }
    
    // Em seguida, atualizamos com o valor incrementado
    const currentViewCount = post?.view_count || 0;
    
    const { error } = await updatePost(postId, { view_count: currentViewCount + 1 });
    
    if (error) {
      console.error('Erro ao incrementar visualizações:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Erro ao incrementar visualizações:', err);
    return false;
  }
};
