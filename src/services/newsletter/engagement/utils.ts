
import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

// Mapa para rastrear operações recentes de engajamento
const recentEngagementOperations = new Map<string, number>();
const OPERATION_COOLDOWN = 2000; // 2 segundos de cooldown entre operações idênticas

/**
 * Verifica se a operação pode ser executada ou está em cooldown
 * @param key identificador da operação
 * @returns boolean indicando se a operação pode ser executada
 */
export const canPerformOperation = (key: string): boolean => {
  const now = Date.now();
  const lastOperation = recentEngagementOperations.get(key);
  
  if (lastOperation && now - lastOperation < OPERATION_COOLDOWN) {
    return false;
  }
  
  recentEngagementOperations.set(key, now);
  return true;
};

/**
 * Obtém um post pelo ID
 * @param postId ID do post
 * @returns Promise com os dados do post ou erro
 */
export const getPostById = async (postId: string) => {
  return await supabase
    .from('newsletter_posts')
    .select('*')
    .eq('id', postId)
    .single();
};

/**
 * Atualiza um post com novos valores
 * @param postId ID do post
 * @param updateData Dados a serem atualizados
 * @returns Promise com o resultado da operação
 */
export const updatePost = async (postId: string, updateData: Record<string, any>) => {
  return await supabase
    .from('newsletter_posts')
    .update(updateData)
    .eq('id', postId);
};

/**
 * Verifica se registro existe na tabela por condições
 * @param table Nome da tabela
 * @param conditions Condições para filtrar
 * @returns Promise<boolean> indicando se existe
 */
export const recordExists = async (
  table: "post_likes" | "post_comments" | "newsletter_posts" | string, 
  conditions: Record<string, any>
): Promise<boolean> => {
  const { data, error, count } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .match(conditions);
  
  if (error) {
    console.error(`Error checking record existence in ${table}:`, error);
    return false;
  }
  
  return (count || 0) > 0;
};
