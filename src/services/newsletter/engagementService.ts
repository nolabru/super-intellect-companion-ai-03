
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Incrementa a contagem de visualizações de um post
 * @param postId ID do post
 * @returns Promise<boolean> Sucesso da operação
 */
export const incrementViewCount = async (postId: string): Promise<boolean> => {
  try {
    // Primeiro obtemos a contagem atual de visualizações
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('view_count')
      .eq('id', postId)
      .single();
    
    if (fetchError) {
      console.error('Erro ao buscar contagem de visualizações:', fetchError);
      return false;
    }
    
    // Em seguida, atualizamos com o valor incrementado
    const currentViewCount = post?.view_count || 0;
    
    const { error } = await supabase
      .from('posts')
      .update({ view_count: currentViewCount + 1 })
      .eq('id', postId);
    
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

/**
 * Incrementa a contagem de curtidas de um post
 * @param postId ID do post
 * @param userId ID do usuário
 * @returns Promise<boolean> Sucesso da operação
 */
export const incrementLikeCount = async (postId: string, userId: string): Promise<boolean> => {
  try {
    // Verificar se o usuário já curtiu o post
    const { data: existingLike, error: checkError } = await supabase
      .from('post_likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found, que é o esperado
      console.error('Erro ao verificar curtida:', checkError);
      return false;
    }
    
    if (existingLike) {
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
    
    // Buscar contagem atual
    const { data: post, error: fetchError } = await supabase
      .from('posts_with_counts')
      .select('likes_count')
      .eq('id', postId)
      .single();
      
    if (fetchError) {
      console.error('Erro ao buscar contagem de curtidas:', fetchError);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Erro ao incrementar curtidas:', err);
    return false;
  }
};

/**
 * Incrementa a contagem de compartilhamentos de um post
 * @param postId ID do post
 * @returns Promise<boolean> Sucesso da operação
 */
export const incrementShareCount = async (postId: string): Promise<boolean> => {
  try {
    // Incrementamos a tabela de estatísticas de compartilhamento
    const { error } = await supabase
      .from('post_shares')
      .insert([{ post_id: postId }]);
    
    if (error) {
      console.error('Erro ao registrar compartilhamento:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Erro ao incrementar compartilhamentos:', err);
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
  
  try {
    const { data, error } = await supabase
      .from('post_likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao verificar se usuário curtiu o post:', error);
      return false;
    }
    
    return !!data;
  } catch (err) {
    console.error('Erro ao verificar curtida do usuário:', err);
    return false;
  }
};
