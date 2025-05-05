
import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';
import { CommentWithUser } from '@/types/newsletter';
import { CommentsQueryResult, CommentResult } from './types';

/**
 * Busca comentários de um post
 * @param postId ID do post
 * @param limit Limite de comentários
 * @param offset Offset para paginação
 * @returns Array de comentários com dados dos usuários
 */
export const queryCommentsByPostId = async (
  postId: string,
  limit = 10,
  offset = 0
): Promise<CommentsQueryResult> => {
  try {
    const { data, count, error } = await supabase
      .from('post_comments')
      .select('*, profiles!post_comments_user_id_fkey(*)')
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw error;
    }
    
    const comments: CommentWithUser[] = (data || []).map(item => {
      const profile = item.profiles || {};
      return {
        id: item.id,
        post_id: item.post_id,
        user_id: item.user_id,
        content: item.content,
        created_at: item.created_at,
        updated_at: item.updated_at,
        // Handle potentially missing profile data with defaults
        username: profile.username || 'Usuário',
        display_name: profile.display_name || '',
        avatar_url: profile.avatar_url || null,
        user: {
          username: profile.username || 'Usuário',
          avatar_url: profile.avatar_url || null
        }
      };
    });
    
    return {
      comments,
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
 * Publica um comentário em um post
 * @param postId ID do post
 * @param content Conteúdo do comentário
 * @param userId ID do usuário autor
 * @returns Dados do comentário criado
 */
export const publishComment = async (
  postId: string,
  content: string,
  userId: string
): Promise<CommentResult> => {
  try {
    // Verificar se o post existe
    const { data: post, error: postError } = await supabase
      .from('newsletter_posts')
      .select('id')
      .eq('id', postId)
      .single();
    
    if (postError) {
      throw new Error('Post não encontrado');
    }
    
    // Criar comentário
    const { data, error } = await supabase
      .from('post_comments')
      .insert([
        {
          post_id: postId,
          user_id: userId,
          content
        }
      ])
      .select('*')
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      throw new Error('Erro ao criar comentário');
    }
    
    // Buscar dados do usuário
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', userId)
      .single();
    
    // Define default values for userData
    const username = userData?.username || 'Usuário';
    const avatar_url = userData?.avatar_url || null;
    
    // Retornar comentário com dados do usuário
    const comment: CommentWithUser = {
      ...data,
      username: username,
      display_name: '', // Profiles não tem display_name
      avatar_url: avatar_url,
      user: {
        username: username,
        avatar_url: avatar_url
      }
    };
    
    return { comment, error: null };
  } catch (err) {
    console.error('Erro ao publicar comentário:', err);
    return {
      comment: null,
      error: err as PostgrestError
    };
  }
};
