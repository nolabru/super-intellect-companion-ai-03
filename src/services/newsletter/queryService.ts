
import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';
import { PostWithCounts, CommentWithUser, PostFilterParams } from '@/types/newsletter';

/**
 * Busca posts para a página inicial da newsletter
 * @param params Parâmetros de filtragem
 * @returns Array de posts com contagens de engajamento
 */
export const queryPosts = async ({
  limit = 10,
  offset = 0,
  onlyPublished = true,
  authorId = null,
  sortBy = 'published_at',
  sortDirection = 'desc'
}: PostFilterParams): Promise<{
  posts: PostWithCounts[];
  count: number;
  error: PostgrestError | null;
}> => {
  try {
    // Montar query base
    let query = supabase
      .from('posts_with_counts')
      .select('*', { count: 'exact' });
    
    // Adicionar filtros
    if (onlyPublished) {
      query = query.eq('is_published', true);
    }
    
    if (authorId) {
      query = query.eq('author_id', authorId);
    }
    
    // Adicionar ordenação e paginação
    query = query
      .order(sortBy, { ascending: sortDirection === 'asc' })
      .range(offset, offset + limit - 1);
    
    const { data, count, error } = await query;
    
    const posts: PostWithCounts[] = (data || []) as PostWithCounts[];
    
    return {
      posts,
      count: count || 0,
      error
    };
  } catch (err) {
    console.error('Erro ao consultar posts:', err);
    return {
      posts: [],
      count: 0,
      error: err as PostgrestError
    };
  }
};

/**
 * Busca um post específico pelo ID
 * @param postId ID do post
 * @returns Post com contagens de engajamento
 */
export const queryPostById = async (postId: string): Promise<{
  post: PostWithCounts | null;
  error: PostgrestError | null;
}> => {
  try {
    const { data, error } = await supabase
      .from('posts_with_counts')
      .select('*')
      .eq('id', postId)
      .single();
    
    if (error) {
      throw error;
    }
    
    return {
      post: data as PostWithCounts,
      error: null
    };
  } catch (err) {
    console.error('Erro ao buscar post por ID:', err);
    return {
      post: null,
      error: err as PostgrestError
    };
  }
};

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
): Promise<{
  comments: CommentWithUser[];
  count: number;
  error: PostgrestError | null;
}> => {
  try {
    const { data, count, error } = await supabase
      .from('comments_with_users')
      .select('*', { count: 'exact' })
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw error;
    }
    
    const comments: CommentWithUser[] = (data || []) as CommentWithUser[];
    
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
): Promise<{
  comment: CommentWithUser | null;
  error: PostgrestError | null;
}> => {
  try {
    // Verificar se o post existe
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single();
    
    if (postError) {
      throw new Error('Post não encontrado');
    }
    
    // Criar comentário
    const { data, error } = await supabase
      .from('comments')
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
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.warn('Erro ao buscar dados do usuário:', userError);
    }
    
    // Retornar comentário com dados do usuário
    const comment: CommentWithUser = {
      ...data,
      username: userData?.username || 'Usuário',
      avatar_url: userData?.avatar_url || null,
      display_name: userData?.display_name || 'Usuário',
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

/**
 * Busca posts relacionados a um post específico
 * @param postId ID do post de referência
 * @param limit Limite de posts
 * @returns Array de posts relacionados
 */
export const queryRelatedPosts = async (postId: string, limit = 3): Promise<{
  posts: PostWithCounts[];
  error: PostgrestError | null;
}> => {
  try {
    // Primeiro buscar o post atual para ter sua categoria
    const { data: currentPost, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .single();
    
    if (postError) {
      throw postError;
    }

    // Buscar posts relacionados (da mesma categoria, excluindo o atual)
    const { data, error } = await supabase
      .from('posts_with_counts')
      .select('*')
      .eq('is_published', true)
      .neq('id', postId)
      .order('published_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw error;
    }
    
    return {
      posts: data as PostWithCounts[],
      error: null
    };
  } catch (err) {
    console.error('Erro ao buscar posts relacionados:', err);
    return {
      posts: [],
      error: err as PostgrestError
    };
  }
};
