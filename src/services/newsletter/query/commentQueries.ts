
import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';
import { CommentWithUser } from '@/types/newsletter';
import { CommentsQueryResult, CommentResult } from './types';

/**
 * Busca comentários para um post específico
 * @param postId ID do post
 * @returns Array de comentários com informações do usuário
 */
export const queryComments = async (postId: string): Promise<CommentsQueryResult> => {
  try {
    // Primeiro buscar os comentários
    const { data: comments, error, count } = await supabase
      .from('post_comments')
      .select('*', { count: 'exact' })
      .eq('post_id', postId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    // Array para armazenar comentários processados
    const processedComments: CommentWithUser[] = [];
    
    // Processar cada comentário para obter dados do usuário
    for (const comment of comments || []) {
      // Buscar informações do usuário
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', comment.user_id)
        .single();
      
      // Combinar dados do comentário com dados do usuário
      const username = userData?.username || 'Usuário';
      const avatar_url = userData?.avatar_url || null;
      
      // Formato compatível com a interface CommentWithUser
      processedComments.push({
        ...comment,
        username,
        display_name: null, // Set as null since it doesn't exist in profiles table
        avatar_url,
        user: {
          username: username,
          avatar_url: avatar_url
        }
      });
    }
    
    return {
      comments: processedComments,
      count: count || 0,
      error: null
    };
  } catch (err) {
    console.error('Erro ao buscar comentários:', err);
    return {
      comments: [],
      count: 0,
      error: err as PostgrestError
    };
  }
};

/**
 * Implementação das funções wrapper para compatibilidade com código existente
 */
export const getComments = async (postId: string) => {
  const result = await queryComments(postId);
  return result.comments;
};
