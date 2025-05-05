import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Mapa para rastrear operações recentes de engajamento
const recentEngagementOperations = new Map<string, number>();
const OPERATION_COOLDOWN = 2000; // 2 segundos de cooldown entre operações idênticas

/**
 * Verifica se a operação pode ser executada ou está em cooldown
 * @param key identificador da operação
 * @returns boolean indicando se a operação pode ser executada
 */
const canPerformOperation = (key: string): boolean => {
  const now = Date.now();
  const lastOperation = recentEngagementOperations.get(key);
  
  if (lastOperation && now - lastOperation < OPERATION_COOLDOWN) {
    return false;
  }
  
  recentEngagementOperations.set(key, now);
  return true;
};

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
    const { data: post, error: fetchError } = await supabase
      .from('newsletter_posts')
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
      .from('newsletter_posts')
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
  const operationKey = `like_${postId}_${userId}`;
  if (!canPerformOperation(operationKey)) {
    return false; // Evita curtidas duplicadas em sequência rápida
  }
  
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
      .from('newsletter_posts')
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
  const operationKey = `share_${postId}`;
  if (!canPerformOperation(operationKey)) {
    return true; // Ignora compartilhamentos duplicados em sequência rápida
  }
  
  try {
    // Primeiro obtemos a contagem atual de compartilhamentos (ou 0 se não existir)
    const { data: post, error: fetchError } = await supabase
      .from('newsletter_posts')
      .select('*')
      .eq('id', postId)
      .single();
    
    if (fetchError) {
      console.error('Erro ao buscar informações do post:', fetchError);
      return false;
    }
    
    // We need to determine if shares_count exists in the database structure
    // If it doesn't, we'll add it with a default value of 1
    // If it does, we'll increment it
    
    // Check if post has a shares_count property
    const currentShareCount = post.shares_count !== undefined ? post.shares_count : 0;
    
    // Use an update operation that doesn't specify shares_count if it doesn't exist
    const updateData: any = {};
    updateData.shares_count = currentShareCount + 1;
    
    const { error } = await supabase
      .from('newsletter_posts')
      .update(updateData)
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
